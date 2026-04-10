import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { readAccountTypeFromUser, type AccountType } from '@/src/features/session/account';
import { useSessionStore } from '@/src/features/session/session-store';
import { supabase } from '@/src/shared/api/supabase/client';

type JsonPrimitive = boolean | null | number | string;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
type ErrorSeverity = 'error' | 'fatal' | 'warning';

type ErrorUtilsHandler = (error: Error, isFatal?: boolean) => void;
type ErrorUtilsShape = {
  getGlobalHandler?: () => ErrorUtilsHandler;
  setGlobalHandler?: (handler: ErrorUtilsHandler) => void;
};

export type TelemetryEventName =
  | 'app_foregrounded'
  | 'app_session_started'
  | 'auth_email_confirmation_completed'
  | 'auth_password_updated'
  | 'auth_sign_in_succeeded'
  | 'auth_sign_out_requested'
  | 'candidate_selected_for_contract'
  | 'chat_message_sent'
  | 'contract_cancelled'
  | 'contract_completed'
  | 'contract_confirmed'
  | 'contract_rescheduled'
  | 'direct_invite_cancelled'
  | 'direct_invite_declined'
  | 'direct_invite_sent'
  | 'opportunity_applied'
  | 'opportunity_draft_saved'
  | 'opportunity_published'
  | 'opportunity_status_changed'
  | 'opportunity_updated'
  | 'payment_checkout_opened'
  | 'payment_connect_onboarding_opened'
  | 'payment_connect_status_synced'
  | 'payment_payout_release_requested'
  | 'push_dispatch_requested'
  | 'push_notification_opened'
  | 'push_notification_received'
  | 'push_permission_requested'
  | 'push_preferences_updated'
  | 'push_token_synced'
  | 'profile_media_deleted'
  | 'profile_media_uploaded'
  | 'profile_saved'
  | 'review_submitted'
  | 'screen_view'
  | 'session_restored';

export type TelemetryEventInput = {
  accountId?: string | null;
  accountType?: AccountType | null;
  applicationId?: string | null;
  context?: Record<string, unknown>;
  contractId?: string | null;
  eventName: TelemetryEventName;
  opportunityId?: string | null;
  pathname?: string | null;
};

export type TelemetryErrorInput = {
  accountId?: string | null;
  accountType?: AccountType | null;
  context?: Record<string, unknown>;
  error: unknown;
  pathname?: string | null;
  severity?: ErrorSeverity;
  source: string;
};

const runtimeSessionId = `telemetry-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
const runtimeMetadata = {
  appOwnership: Constants.appOwnership ?? null,
  appVersion: Constants.expoConfig?.version ?? null,
  nativeBuildVersion: Constants.expoConfig?.android?.versionCode
    ? String(Constants.expoConfig.android.versionCode)
    : null,
  platform: Platform.OS,
} as const;

let currentPathname: string | null = null;
let globalErrorHandlerInstalled = false;

function isJsonPrimitive(value: unknown): value is JsonPrimitive {
  return (
    value === null ||
    typeof value === 'boolean' ||
    typeof value === 'number' ||
    typeof value === 'string'
  );
}

function sanitizeJsonValue(value: unknown): JsonValue | undefined {
  if (isJsonPrimitive(value)) {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeJsonValue(item))
      .filter((item): item is JsonValue => item !== undefined);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Error) {
    return {
      message: value.message,
      name: value.name,
      stack: value.stack ?? null,
    };
  }

  if (value && typeof value === 'object') {
    const sanitizedEntries = Object.entries(value).reduce<Record<string, JsonValue>>(
      (accumulator, [key, nestedValue]) => {
        const sanitizedValue = sanitizeJsonValue(nestedValue);

        if (sanitizedValue !== undefined) {
          accumulator[key] = sanitizedValue;
        }

        return accumulator;
      },
      {},
    );

    return sanitizedEntries;
  }

  if (value === undefined) {
    return undefined;
  }

  return String(value);
}

function sanitizeContext(context?: Record<string, unknown>) {
  return (sanitizeJsonValue(context ?? {}) as Record<string, JsonValue>) ?? {};
}

function normalizeErrorPayload(error: unknown) {
  if (error instanceof Error) {
    return {
      fingerprint: error.name,
      message: error.message,
      stack: error.stack ?? null,
    };
  }

  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
  ) {
    const errorWithMessage = error as { code?: unknown; message: string; stack?: unknown };

    return {
      fingerprint: typeof errorWithMessage.code === 'string' ? errorWithMessage.code : 'unknown',
      message: errorWithMessage.message,
      stack: typeof errorWithMessage.stack === 'string' ? errorWithMessage.stack : null,
    };
  }

  return {
    fingerprint: 'unknown',
    message: typeof error === 'string' ? error : 'Erro nao identificado no runtime do app.',
    stack: null,
  };
}

async function readTelemetryActor() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  const user = data.session?.user ?? null;
  const storedAccountType = useSessionStore.getState().accountType;

  return {
    accountId: user?.id ?? null,
    accountType: readAccountTypeFromUser(user) ?? storedAccountType,
  };
}

function buildBaseContext(context?: Record<string, unknown>) {
  return {
    ...runtimeMetadata,
    ...sanitizeContext(context),
  };
}

export function setTelemetryPathname(pathname: string | null) {
  currentPathname = pathname;
}

export function getTelemetryPathname() {
  return currentPathname;
}

export function serializeTelemetryKey(value: unknown) {
  const sanitizedValue = sanitizeJsonValue(value);

  try {
    return JSON.stringify(sanitizedValue ?? null);
  } catch {
    return '"unserializable"';
  }
}

export async function recordTelemetryEvent(input: TelemetryEventInput) {
  try {
    const actor = await readTelemetryActor();

    if (!(input.accountId ?? actor.accountId)) {
      return;
    }

    const { error } = await supabase.rpc('log_telemetry_event', {
      p_application_id: input.applicationId ?? null,
      p_context: buildBaseContext(input.context),
      p_contract_id: input.contractId ?? null,
      p_event_name: input.eventName,
      p_opportunity_id: input.opportunityId ?? null,
      p_pathname: input.pathname ?? currentPathname,
      p_session_id: runtimeSessionId,
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.warn('Falha ao registrar evento de telemetria.', error);
  }
}

export async function recordTelemetryError(input: TelemetryErrorInput) {
  try {
    const actor = await readTelemetryActor();

    if (!(input.accountId ?? actor.accountId)) {
      return;
    }

    const normalizedError = normalizeErrorPayload(input.error);

    const { error } = await supabase.rpc('log_app_error_event', {
      p_context: buildBaseContext(input.context),
      p_fingerprint: normalizedError.fingerprint,
      p_message: normalizedError.message,
      p_pathname: input.pathname ?? currentPathname,
      p_session_id: runtimeSessionId,
      p_severity: input.severity ?? 'error',
      p_source: input.source,
      p_stack: normalizedError.stack,
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.warn('Falha ao registrar erro de observabilidade.', error);
  }
}

export function reportTelemetryEvent(input: TelemetryEventInput) {
  void recordTelemetryEvent(input);
}

export function reportTelemetryError(input: TelemetryErrorInput) {
  void recordTelemetryError(input);
}

export function installGlobalTelemetryErrorHandler() {
  if (globalErrorHandlerInstalled) {
    return;
  }

  const errorUtils = (globalThis as typeof globalThis & { ErrorUtils?: ErrorUtilsShape }).ErrorUtils;

  if (!errorUtils?.setGlobalHandler) {
    return;
  }

  const previousHandler = errorUtils.getGlobalHandler?.();

  errorUtils.setGlobalHandler((error, isFatal) => {
    reportTelemetryError({
      context: {
        isFatal: Boolean(isFatal),
      },
      error,
      severity: isFatal ? 'fatal' : 'error',
      source: 'global_js',
    });

    previousHandler?.(error, isFatal);
  });

  globalErrorHandlerInstalled = true;
}
