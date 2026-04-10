import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { reportTelemetryError, reportTelemetryEvent } from '@/src/features/observability/telemetry';
import { supabase } from '@/src/shared/api/supabase/client';
import { env } from '@/src/shared/api/supabase/env';

export type PushPermissionStatus = 'denied' | 'granted' | 'undetermined' | 'unsupported';
export type PushRegistrationPlatform = 'android' | 'ios' | 'web';
export type MarketplacePushEventType =
  | 'chat_message_received'
  | 'contract_confirmed'
  | 'direct_invite_sent'
  | 'opportunity_application_created';

type AccountNotificationPreferencesRow = {
  notify_chat_message: boolean;
  notify_contract_update: boolean;
  notify_direct_invite: boolean;
  notify_new_application: boolean;
  notify_payment_update: boolean;
  push_enabled: boolean;
  updated_at: string;
};

type UpsertPushRegistrationInput = {
  appBuild?: string | null;
  deviceName?: string | null;
  expoPushToken: string | null;
  installationId: string;
  permissionStatus: Exclude<PushPermissionStatus, 'unsupported'>;
  platform: PushRegistrationPlatform;
};

export type MarketplacePushDispatchInput = {
  applicationId?: string | null;
  contractId?: string | null;
  eventType: MarketplacePushEventType;
  opportunityId?: string | null;
};

export type AccountNotificationPreferences = {
  notifyChatMessage: boolean;
  notifyContractUpdate: boolean;
  notifyDirectInvite: boolean;
  notifyNewApplication: boolean;
  notifyPaymentUpdate: boolean;
  pushEnabled: boolean;
  updatedAt: string | null;
};

export const DEFAULT_ACCOUNT_NOTIFICATION_PREFERENCES: AccountNotificationPreferences = {
  notifyChatMessage: true,
  notifyContractUpdate: true,
  notifyDirectInvite: true,
  notifyNewApplication: true,
  notifyPaymentUpdate: true,
  pushEnabled: true,
  updatedAt: null,
};

async function requireAuthenticatedUserId(message: string) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error(message);
  }

  return user.id;
}

async function getValidAccessToken() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  let session = data.session;

  if (!session) {
    throw new Error('Sua sessao expirou. Entre novamente para continuar.');
  }

  if (session.refresh_token) {
    const { data: refreshedData, error: refreshError } = await supabase.auth.refreshSession();

    if (refreshError && !session.access_token) {
      throw refreshError;
    }

    if (refreshedData.session?.access_token) {
      session = refreshedData.session;
    }
  }

  if (!session?.access_token) {
    throw new Error('Nao foi possivel obter um token valido para esta operacao.');
  }

  return session.access_token;
}

async function fetchAccountNotificationPreferences() {
  await requireAuthenticatedUserId('Sessao expirada. Entre novamente para ajustar as notificacoes.');

  const { data, error } = await supabase
    .from('account_notification_preferences')
    .select(
      'push_enabled, notify_new_application, notify_direct_invite, notify_chat_message, notify_contract_update, notify_payment_update, updated_at',
    )
    .maybeSingle();

  if (error) {
    throw error;
  }

  return mapNotificationPreferences(data as AccountNotificationPreferencesRow | null);
}

async function updateAccountNotificationPreferences(
  input: Partial<Omit<AccountNotificationPreferences, 'updatedAt'>>,
) {
  const accountId = await requireAuthenticatedUserId(
    'Sessao expirada. Entre novamente para ajustar as notificacoes.',
  );
  const current = await fetchAccountNotificationPreferences();

  const payload = {
    account_id: accountId,
    notify_chat_message: input.notifyChatMessage ?? current.notifyChatMessage,
    notify_contract_update: input.notifyContractUpdate ?? current.notifyContractUpdate,
    notify_direct_invite: input.notifyDirectInvite ?? current.notifyDirectInvite,
    notify_new_application: input.notifyNewApplication ?? current.notifyNewApplication,
    notify_payment_update: input.notifyPaymentUpdate ?? current.notifyPaymentUpdate,
    push_enabled: input.pushEnabled ?? current.pushEnabled,
  };

  const { error } = await supabase.from('account_notification_preferences').upsert(payload, {
    onConflict: 'account_id',
  });

  if (error) {
    throw error;
  }

  reportTelemetryEvent({
    context: {
      pushEnabled: payload.push_enabled,
    },
    eventName: 'push_preferences_updated',
  });

  return fetchAccountNotificationPreferences();
}

async function upsertAccountPushRegistration(input: UpsertPushRegistrationInput) {
  const { data, error } = await supabase.rpc('upsert_account_push_registration', {
    p_app_build: input.appBuild ?? null,
    p_device_name: input.deviceName ?? null,
    p_expo_push_token: input.expoPushToken,
    p_installation_id: input.installationId,
    p_permission_status: input.permissionStatus,
    p_platform: input.platform,
  });

  if (error) {
    throw error;
  }

  reportTelemetryEvent({
    context: {
      hasToken: Boolean(input.expoPushToken),
      permissionStatus: input.permissionStatus,
      platform: input.platform,
    },
    eventName: 'push_token_synced',
  });

  return data as string;
}

async function dispatchMarketplacePushEvent(input: MarketplacePushDispatchInput) {
  const accessToken = await getValidAccessToken();
  const response = await fetch(`${env.supabaseUrl}/functions/v1/marketplace-push-dispatch`, {
    method: 'POST',
    headers: {
      apikey: env.supabasePublishableKey,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw await normalizePushDispatchError(response);
  }

  reportTelemetryEvent({
    applicationId: input.applicationId ?? null,
    context: {
      eventType: input.eventType,
    },
    contractId: input.contractId ?? null,
    eventName: 'push_dispatch_requested',
    opportunityId: input.opportunityId ?? null,
  });
}

function mapNotificationPreferences(
  row: AccountNotificationPreferencesRow | null,
): AccountNotificationPreferences {
  if (!row) {
    return DEFAULT_ACCOUNT_NOTIFICATION_PREFERENCES;
  }

  return {
    notifyChatMessage: row.notify_chat_message,
    notifyContractUpdate: row.notify_contract_update,
    notifyDirectInvite: row.notify_direct_invite,
    notifyNewApplication: row.notify_new_application,
    notifyPaymentUpdate: row.notify_payment_update,
    pushEnabled: row.push_enabled,
    updatedAt: row.updated_at,
  };
}

async function normalizePushDispatchError(response: Response) {
  try {
    const payload = (await response.json()) as { message?: string } | null;

    if (payload?.message?.trim()) {
      return new Error(payload.message);
    }
  } catch {
    // noop
  }

  return new Error('Nao foi possivel disparar a notificacao push deste evento.');
}

export function notifyMarketplacePushEvent(input: MarketplacePushDispatchInput) {
  void dispatchMarketplacePushEvent(input).catch((error) => {
    reportTelemetryError({
      context: {
        applicationId: input.applicationId ?? null,
        contractId: input.contractId ?? null,
        eventType: input.eventType,
        opportunityId: input.opportunityId ?? null,
      },
      error,
      source: 'marketplace_push_dispatch',
    });
  });
}

export function useAccountNotificationPreferences(enabled = true) {
  return useQuery({
    enabled,
    queryFn: fetchAccountNotificationPreferences,
    queryKey: ['notifications', 'preferences'],
  });
}

export function useUpdateAccountNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAccountNotificationPreferences,
    mutationKey: ['notifications', 'preferences', 'update'],
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications', 'preferences'] });
    },
  });
}

export function useSyncPushRegistration() {
  return useMutation({
    mutationFn: upsertAccountPushRegistration,
    mutationKey: ['notifications', 'registration', 'sync'],
  });
}
