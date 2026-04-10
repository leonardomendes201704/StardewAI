import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  reportTelemetryError,
  reportTelemetryEvent,
  type TelemetryEventName,
} from '@/src/features/observability/telemetry';
import { type AccountType } from '@/src/features/session/account';
import { type OpportunityRecord, type WeekdayKey } from '@/src/features/opportunities/opportunities';
import { supabase } from '@/src/shared/api/supabase/client';
import { env } from '@/src/shared/api/supabase/env';

export type ContractPaymentChargeKind = 'single_event' | 'deposit' | 'balance';
export type ContractPaymentOccurrenceStatus =
  | 'draft'
  | 'checkout_open'
  | 'payment_pending'
  | 'funds_held'
  | 'transfer_pending'
  | 'transferred'
  | 'transfer_reversed'
  | 'checkout_expired'
  | 'failed'
  | 'refunded'
  | 'cancelled';

export type StripeConnectedAccountStatus =
  | 'not_started'
  | 'onboarding_required'
  | 'pending_review'
  | 'ready'
  | 'restricted';

type ContractPaymentOccurrenceRow = {
  amount_cents: number;
  charge_kind: ContractPaymentChargeKind;
  checkout_expires_at: string | null;
  contract_id: string;
  failed_at: string | null;
  failure_code: string | null;
  failure_message: string | null;
  id: string;
  musician_payout_cents: number;
  occurrence_date: string;
  paid_at: string | null;
  platform_fee_cents: number;
  refunded_at: string | null;
  release_after: string | null;
  status: ContractPaymentOccurrenceStatus;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_transfer_id: string | null;
  transferred_at: string | null;
};

type AccountPaymentProfileRow = {
  stripe_connected_account_id: string | null;
  stripe_connected_account_status: StripeConnectedAccountStatus;
  stripe_last_connect_sync_at: string | null;
  stripe_last_payout_attempt_at: string | null;
  stripe_onboarding_completed_at: string | null;
  stripe_payouts_capability_status: string | null;
  stripe_requirements_disabled_reason: string | null;
  stripe_requirements_due: string[] | null;
  stripe_requirements_pending: string[] | null;
  stripe_transfers_capability_status: string | null;
};

export type ContractPaymentSnapshot = {
  amountCents: number;
  chargeKind: ContractPaymentChargeKind;
  checkoutExpiresAt: string | null;
  contractId: string;
  failedAt: string | null;
  failureCode: string | null;
  failureMessage: string | null;
  id: string | null;
  musicianPayoutCents: number | null;
  occurrenceDate: string;
  paidAt: string | null;
  platformFeeCents: number | null;
  refundedAt: string | null;
  releaseAfter: string | null;
  status: ContractPaymentOccurrenceStatus;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  stripeTransferId: string | null;
  transferredAt: string | null;
};

export type MusicianStripeConnectSnapshot = {
  accountId: string | null;
  lastConnectSyncAt: string | null;
  lastPayoutAttemptAt: string | null;
  onboardingCompletedAt: string | null;
  payoutsCapabilityStatus: string | null;
  requirementsDisabledReason: string | null;
  requirementsDue: string[];
  requirementsPending: string[];
  status: StripeConnectedAccountStatus;
  transfersCapabilityStatus: string | null;
};

type CreatePlatformCheckoutInput = {
  contractId: string;
  occurrenceDate: string;
};

type CreatePlatformCheckoutResponse = {
  amountCents: number;
  chargeKind: ContractPaymentChargeKind;
  checkoutUrl: string;
  musicianPayoutCents: number;
  occurrenceDate: string;
  occurrenceId: string;
  platformFeeCents: number;
  reusedSession?: boolean;
  status: ContractPaymentOccurrenceStatus;
};

type StripeConnectSnapshotResponse = {
  accountId: string | null;
  snapshot: {
    accountId: string;
    disabledReason: string | null;
    payoutsCapabilityStatus: string | null;
    requirementsDue: string[];
    requirementsPending: string[];
    status: StripeConnectedAccountStatus;
    transfersCapabilityStatus: string | null;
  };
};

type CreateMusicianConnectOnboardingResponse = {
  accountId: string;
  alreadyReady: boolean;
  onboardingExpiresAt?: string | null;
  onboardingUrl: string | null;
  snapshot: {
    accountId: string;
    disabledReason: string | null;
    payoutsCapabilityStatus: string | null;
    requirementsDue: string[];
    requirementsPending: string[];
    status: StripeConnectedAccountStatus;
    transfersCapabilityStatus: string | null;
  };
};

type ReleaseMusicianPayoutResponse = {
  occurrenceId: string;
  reason?: string | null;
  status: ContractPaymentOccurrenceStatus;
  stripeTransferId?: string | null;
};

async function getValidSupabaseAccessToken(trace: string[]) {
  trace.push('session:read');
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  let session = sessionData.session;

  if (!session) {
    throw new Error('Sua sessao expirou. Entre novamente para abrir o Checkout.');
  }

  if (session.refresh_token) {
    trace.push('session:refresh');
    const { data: refreshedData, error: refreshError } = await supabase.auth.refreshSession();

    if (refreshError && !session.access_token) {
      throw refreshError;
    }

    if (refreshedData.session?.access_token) {
      session = refreshedData.session;
    }
  }

  if (!session?.access_token) {
    throw new Error('Nao foi possivel obter um token valido para abrir o Checkout.');
  }

  return session.access_token;
}

async function callAuthenticatedPaymentFunction<TPayload, TResponse>(
  functionSlug: string,
  payload: TPayload,
  trace: string[],
) {
  const accessToken = await getValidSupabaseAccessToken(trace);
  trace.push(`token:length=${accessToken.length}`);
  trace.push(`request:${functionSlug}`);

  const response = await fetch(`${env.supabaseUrl}/functions/v1/${functionSlug}`, {
    method: 'POST',
    headers: {
      apikey: env.supabasePublishableKey,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  trace.push(`response:${response.status}`);

  if (!response.ok) {
    throw await normalizePaymentMutationError(
      response,
      'Nao foi possivel concluir esta operacao financeira.',
      trace,
    );
  }

  return (await response.json()) as TResponse;
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function weekdayKeyFromJsDay(day: number): WeekdayKey {
  return day === 0
    ? 'sun'
    : day === 1
      ? 'mon'
      : day === 2
        ? 'tue'
        : day === 3
          ? 'wed'
          : day === 4
            ? 'thu'
            : day === 5
              ? 'fri'
              : 'sat';
}

export function resolveOpportunityPaymentOccurrenceDate(
  opportunity: Pick<OpportunityRecord, 'event_date' | 'recurrence_days' | 'start_time'>,
  referenceDate = new Date(),
) {
  if ((opportunity.recurrence_days ?? []).length === 0) {
    return opportunity.event_date;
  }

  const [year, month, day] = opportunity.event_date.split('-').map(Number);
  const [hours, minutes] = opportunity.start_time.split(':').map(Number);
  const seriesStart = new Date(year, (month ?? 1) - 1, day ?? 1, hours ?? 0, minutes ?? 0, 0, 0);
  const baseline = new Date(Math.max(seriesStart.getTime(), referenceDate.getTime()));

  for (let offset = 0; offset <= 7; offset += 1) {
    const candidate = new Date(baseline);
    candidate.setHours(0, 0, 0, 0);
    candidate.setDate(candidate.getDate() + offset);

    if (!(opportunity.recurrence_days ?? []).includes(weekdayKeyFromJsDay(candidate.getDay()))) {
      continue;
    }

    candidate.setHours(hours ?? 0, minutes ?? 0, 0, 0);

    if (candidate.getTime() >= referenceDate.getTime()) {
      return formatDateKey(candidate);
    }
  }

  return opportunity.event_date;
}

async function fetchContractPaymentSnapshot(
  contractId: string,
  opportunity: Pick<OpportunityRecord, 'budget_cents' | 'event_date' | 'recurrence_days' | 'start_time'>,
) {
  const occurrenceDate = resolveOpportunityPaymentOccurrenceDate(opportunity);
  const { data, error } = await supabase
    .from('contract_payment_occurrences')
    .select(
      'id, contract_id, occurrence_date, charge_kind, status, amount_cents, platform_fee_cents, musician_payout_cents, checkout_expires_at, release_after, paid_at, transferred_at, refunded_at, failed_at, failure_code, failure_message, stripe_checkout_session_id, stripe_payment_intent_id, stripe_transfer_id',
    )
    .eq('contract_id', contractId)
    .eq('occurrence_date', occurrenceDate)
    .eq('charge_kind', 'single_event')
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return {
      amountCents: opportunity.budget_cents,
      chargeKind: 'single_event',
      checkoutExpiresAt: null,
      contractId,
      failedAt: null,
      failureCode: null,
      failureMessage: null,
      id: null,
      musicianPayoutCents: null,
      occurrenceDate,
      paidAt: null,
      platformFeeCents: null,
      refundedAt: null,
      releaseAfter: null,
      status: 'draft',
      stripeCheckoutSessionId: null,
      stripePaymentIntentId: null,
      stripeTransferId: null,
      transferredAt: null,
    } satisfies ContractPaymentSnapshot;
  }

  const row = data as ContractPaymentOccurrenceRow;

  return {
    amountCents: row.amount_cents,
    chargeKind: row.charge_kind,
    checkoutExpiresAt: row.checkout_expires_at,
    contractId: row.contract_id,
    failedAt: row.failed_at,
    failureCode: row.failure_code,
    failureMessage: row.failure_message,
    id: row.id,
    musicianPayoutCents: row.musician_payout_cents,
    occurrenceDate: row.occurrence_date,
    paidAt: row.paid_at,
    platformFeeCents: row.platform_fee_cents,
    refundedAt: row.refunded_at,
    releaseAfter: row.release_after,
    status: row.status,
    stripeCheckoutSessionId: row.stripe_checkout_session_id,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    stripeTransferId: row.stripe_transfer_id,
    transferredAt: row.transferred_at,
  } satisfies ContractPaymentSnapshot;
}

async function createPlatformCheckoutSession(input: CreatePlatformCheckoutInput) {
  const trace: string[] = [];

  try {
    const payload = await callAuthenticatedPaymentFunction<
      {
        chargeKind: 'single_event';
        contractId: string;
        occurrenceDate: string;
      },
      CreatePlatformCheckoutResponse | null
    >(
      'stripe-create-platform-checkout',
      {
        chargeKind: 'single_event',
        contractId: input.contractId,
        occurrenceDate: input.occurrenceDate,
      },
      trace,
    );

    if (!payload?.checkoutUrl) {
      throw buildCheckoutTraceError(
        'A sessao de Checkout foi criada sem URL de redirecionamento.',
        trace,
      );
    }

    reportTelemetryEvent({
      context: {
        occurrenceDate: payload.occurrenceDate,
        reusedSession: Boolean(payload.reusedSession),
        status: payload.status,
      },
      contractId: input.contractId,
      eventName: 'payment_checkout_opened' satisfies TelemetryEventName,
    });

    return payload;
  } catch (error) {
    reportTelemetryError({
      context: {
        checkoutTrace: trace,
        contractId: input.contractId,
        occurrenceDate: input.occurrenceDate,
      },
      error,
      source: 'stripe_checkout_open',
    });
    throw error;
  }
}

async function fetchMusicianStripeConnectSnapshot() {
  const { data, error } = await supabase
    .from('account_payment_profiles')
    .select(
      'stripe_connected_account_id, stripe_connected_account_status, stripe_transfers_capability_status, stripe_payouts_capability_status, stripe_requirements_due, stripe_requirements_pending, stripe_requirements_disabled_reason, stripe_onboarding_completed_at, stripe_last_connect_sync_at, stripe_last_payout_attempt_at',
    )
    .maybeSingle();

  if (error) {
    throw error;
  }

  const row = data as AccountPaymentProfileRow | null;

  if (!row) {
    return {
      accountId: null,
      lastConnectSyncAt: null,
      lastPayoutAttemptAt: null,
      onboardingCompletedAt: null,
      payoutsCapabilityStatus: null,
      requirementsDisabledReason: null,
      requirementsDue: [],
      requirementsPending: [],
      status: 'not_started',
      transfersCapabilityStatus: null,
    } satisfies MusicianStripeConnectSnapshot;
  }

  return {
    accountId: row.stripe_connected_account_id,
    lastConnectSyncAt: row.stripe_last_connect_sync_at,
    lastPayoutAttemptAt: row.stripe_last_payout_attempt_at,
    onboardingCompletedAt: row.stripe_onboarding_completed_at,
    payoutsCapabilityStatus: row.stripe_payouts_capability_status,
    requirementsDisabledReason: row.stripe_requirements_disabled_reason,
    requirementsDue: row.stripe_requirements_due ?? [],
    requirementsPending: row.stripe_requirements_pending ?? [],
    status: row.stripe_connected_account_status ?? 'not_started',
    transfersCapabilityStatus: row.stripe_transfers_capability_status,
  } satisfies MusicianStripeConnectSnapshot;
}

async function createMusicianConnectOnboardingLink() {
  const trace: string[] = [];

  try {
    const payload = await callAuthenticatedPaymentFunction<
      Record<string, never>,
      CreateMusicianConnectOnboardingResponse
    >('stripe-create-musician-connect-onboarding', {}, trace);

    reportTelemetryEvent({
      context: {
        accountId: payload.accountId,
        ready: payload.alreadyReady,
        status: payload.snapshot.status,
      },
      eventName: 'payment_connect_onboarding_opened',
    });

    return payload;
  } catch (error) {
    reportTelemetryError({
      context: {
        trace,
      },
      error,
      source: 'stripe_connect_onboarding_open',
    });
    throw error;
  }
}

async function syncMusicianConnectAccount() {
  const trace: string[] = [];

  try {
    const payload = await callAuthenticatedPaymentFunction<
      Record<string, never>,
      StripeConnectSnapshotResponse
    >('stripe-sync-musician-connect-account', {}, trace);

    reportTelemetryEvent({
      context: {
        accountId: payload.accountId,
        status: payload.snapshot.status,
      },
      eventName: 'payment_connect_status_synced',
    });

    return payload;
  } catch (error) {
    reportTelemetryError({
      context: {
        trace,
      },
      error,
      source: 'stripe_connect_sync',
    });
    throw error;
  }
}

export async function attemptReleaseMusicianPayout(contractId: string, occurrenceDate?: string | null) {
  const trace: string[] = [];

  try {
    const payload = await callAuthenticatedPaymentFunction<
      {
        contractId: string;
        occurrenceDate?: string | null;
      },
      ReleaseMusicianPayoutResponse
    >(
      'stripe-release-musician-payout',
      {
        contractId,
        occurrenceDate: occurrenceDate ?? null,
      },
      trace,
    );

    reportTelemetryEvent({
      context: {
        occurrenceDate: occurrenceDate ?? null,
        status: payload.status,
      },
      contractId,
      eventName: 'payment_payout_release_requested',
    });

    return payload;
  } catch (error) {
    reportTelemetryError({
      context: {
        contractId,
        occurrenceDate: occurrenceDate ?? null,
        trace,
      },
      error,
      source: 'stripe_release_payout',
    });
    throw error;
  }
}

export function useContractPaymentSnapshot(
  contractId?: string | null,
  opportunity?: Pick<OpportunityRecord, 'budget_cents' | 'event_date' | 'recurrence_days' | 'start_time'> | null,
) {
  const occurrenceDate = opportunity ? resolveOpportunityPaymentOccurrenceDate(opportunity) : 'missing';

  return useQuery({
    enabled: Boolean(contractId && opportunity),
    queryFn: () => fetchContractPaymentSnapshot(contractId!, opportunity!),
    queryKey: ['payments', 'contract-occurrence', contractId ?? 'missing', occurrenceDate],
  });
}

export function useCreatePlatformCheckoutSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPlatformCheckoutSession,
    mutationKey: ['payments', 'create-platform-checkout'],
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['payments'] }),
        queryClient.invalidateQueries({ queryKey: ['contracts'] }),
      ]);
      await queryClient.invalidateQueries({
        queryKey: ['payments', 'contract-occurrence', variables.contractId, variables.occurrenceDate],
      });
    },
  });
}

export function useMusicianStripeConnectSnapshot() {
  return useQuery({
    queryFn: fetchMusicianStripeConnectSnapshot,
    queryKey: ['payments', 'musician-connect'],
  });
}

export function useCreateMusicianConnectOnboardingLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMusicianConnectOnboardingLink,
    mutationKey: ['payments', 'musician-connect', 'onboarding'],
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['payments', 'musician-connect'] });
    },
  });
}

export function useSyncMusicianConnectAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: syncMusicianConnectAccount,
    mutationKey: ['payments', 'musician-connect', 'sync'],
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['payments', 'musician-connect'] });
      await queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
}

export function useAttemptReleaseMusicianPayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contractId, occurrenceDate }: { contractId: string; occurrenceDate?: string | null }) =>
      attemptReleaseMusicianPayout(contractId, occurrenceDate),
    mutationKey: ['payments', 'release-musician-payout'],
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['payments'] }),
        queryClient.invalidateQueries({ queryKey: ['contracts'] }),
      ]);
      await queryClient.invalidateQueries({
        queryKey: ['payments', 'contract-occurrence', variables.contractId],
      });
    },
  });
}

export function canOpenPlatformCheckout(status: ContractPaymentOccurrenceStatus) {
  return (
    status === 'draft' ||
    status === 'checkout_open' ||
    status === 'checkout_expired' ||
    status === 'failed'
  );
}

export function formatContractPaymentStatusLabel(status: ContractPaymentOccurrenceStatus) {
  switch (status) {
    case 'checkout_open':
      return 'Checkout aberto';
    case 'payment_pending':
      return 'Pagamento em analise';
    case 'funds_held':
      return 'Valor retido';
    case 'transfer_pending':
      return 'Repasse pendente';
    case 'transferred':
      return 'Repasse enviado';
    case 'transfer_reversed':
      return 'Repasse revertido';
    case 'checkout_expired':
      return 'Checkout expirado';
    case 'failed':
      return 'Pagamento falhou';
    case 'refunded':
      return 'Pagamento estornado';
    case 'cancelled':
      return 'Cobranca cancelada';
    case 'draft':
      return 'Checkout ainda nao aberto';
    default:
      return status === 'draft' ? 'Checkout ainda nao aberto' : 'Pagamento pendente';
  }
}

export function getContractPaymentTone(
  status: ContractPaymentOccurrenceStatus,
): 'primary' | 'secondary' | 'muted' {
  if (status === 'funds_held' || status === 'transfer_pending' || status === 'transferred') {
    return 'primary';
  }

  if (status === 'checkout_open' || status === 'payment_pending') {
    return 'secondary';
  }

  return 'muted';
}

export function formatStripeConnectedAccountStatusLabel(status: StripeConnectedAccountStatus) {
  switch (status) {
    case 'ready':
      return 'Pronto para receber';
    case 'pending_review':
      return 'Em revisao';
    case 'restricted':
      return 'Acao necessaria';
    case 'onboarding_required':
      return 'Onboarding pendente';
    case 'not_started':
    default:
      return 'Recebimento nao iniciado';
  }
}

export function buildStripeConnectedAccountStatusCopy(snapshot: MusicianStripeConnectSnapshot) {
  switch (snapshot.status) {
    case 'ready':
      return 'Sua conta Stripe esta pronta para receber repasses assim que um show concluido chegar na etapa de liquidacao.';
    case 'pending_review':
      return 'A Stripe recebeu seus dados e ainda esta revisando alguns requisitos antes de liberar os repasses.';
    case 'restricted':
      return snapshot.requirementsDisabledReason
        ? `A Stripe sinalizou uma pendencia: ${snapshot.requirementsDisabledReason}.`
        : 'Sua conta Stripe precisa de ajustes antes de liberar repasses.';
    case 'onboarding_required':
      return 'Complete o onboarding da Stripe para liberar o recebimento automatico dos seus repasses.';
    case 'not_started':
    default:
      return 'Voce ainda nao conectou uma conta Stripe para receber os repasses dos shows concluidos.';
  }
}

export function buildContractPaymentStatusCopy(
  status: ContractPaymentOccurrenceStatus,
  accountType: AccountType,
) {
  switch (status) {
    case 'draft':
      return accountType === 'bar'
        ? 'A cobranca desta ocorrencia ainda nao foi aberta. Use o Checkout para registrar o pagamento do Bar.'
        : 'O Bar ainda nao abriu a cobranca desta ocorrencia.';
    case 'checkout_open':
      return accountType === 'bar'
        ? 'Ja existe uma sessao de Checkout aberta para esta ocorrencia. Voce pode retoma-la sem criar outra cobranca.'
        : 'O Bar ja recebeu o Checkout desta ocorrencia e pode concluir o pagamento a qualquer momento.';
    case 'payment_pending':
      return 'A Stripe recebeu a tentativa de pagamento e esta finalizando a confirmacao financeira desta ocorrencia.';
    case 'funds_held':
      return accountType === 'bar'
        ? 'O pagamento foi confirmado e o valor esta retido na plataforma ate a conclusao do evento.'
        : 'O pagamento desta ocorrencia foi confirmado e o valor esta retido na plataforma. Depois da conclusao do show, voce pode liberar o repasse para a sua conta Stripe.';
    case 'transfer_pending':
      return accountType === 'bar'
        ? 'O valor desta ocorrencia ja esta confirmado e aguarda o repasse operacional apos o show.'
        : 'O valor desta ocorrencia ja esta confirmado e aguarda o repasse operacional apos o show. Se necessario, revise o recebimento Stripe no seu perfil.';
    case 'transferred':
      return accountType === 'bar'
        ? 'O repasse desta ocorrencia ja foi enviado ao musico.'
        : 'O repasse desta ocorrencia ja foi enviado para a sua conta.';
    case 'transfer_reversed':
      return 'O repasse desta ocorrencia foi revertido para a plataforma e exige revisao operacional.';
    case 'checkout_expired':
      return accountType === 'bar'
        ? 'A sessao anterior expirou. Abra o Checkout novamente para concluir o pagamento.'
        : 'A sessao anterior do pagamento expirou e o Bar precisa abrir um novo Checkout.';
    case 'failed':
      return accountType === 'bar'
        ? 'A cobranca falhou. Abra um novo Checkout para tentar novamente.'
        : 'A ultima tentativa de cobranca falhou e o Bar precisa abrir um novo Checkout.';
    case 'refunded':
      return 'O pagamento desta ocorrencia foi estornado.';
    case 'cancelled':
      return 'A cobranca desta ocorrencia foi encerrada antes da liquidacao.';
    default:
      return 'O status financeiro desta ocorrencia sera atualizado pela Stripe e pelo webhook da plataforma.';
  }
}

export function formatContractPaymentOccurrenceDateLabel(value: string) {
  const [year, month, day] = value.split('-').map((item) => Number.parseInt(item, 10));
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(year, (month ?? 1) - 1, day ?? 1, 12, 0, 0, 0));
}

export function formatPlatformFeeLabel(amountCents: number, platformFeeCents: number) {
  if (amountCents <= 0 || platformFeeCents < 0) {
    return 'Taxa da plataforma';
  }

  const percentage = (platformFeeCents / amountCents) * 100;
  const roundedPercentage = Math.round(percentage * 10) / 10;
  const hasFraction = !Number.isInteger(roundedPercentage);
  const percentageLabel = new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 1,
    minimumFractionDigits: hasFraction ? 1 : 0,
  }).format(roundedPercentage);

  return `Taxa da plataforma (${percentageLabel}%)`;
}

async function normalizePaymentMutationError(
  error: unknown,
  fallbackMessage: string,
  trace: string[],
) {
  const responseMessage = await readFunctionErrorMessage(error);

  if (responseMessage) {
    return buildCheckoutTraceError(responseMessage, trace);
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string' &&
    error.message.trim()
  ) {
    return buildCheckoutTraceError(error.message, trace);
  }

  if (error instanceof Error) {
    return buildCheckoutTraceError(error.message, trace);
  }

  return buildCheckoutTraceError(fallbackMessage, trace);
}

async function readFunctionErrorMessage(error: unknown) {
  const response =
    error instanceof Response
      ? error
      : typeof error === 'object' && error !== null && 'context' in error && error.context instanceof Response
        ? error.context
        : null;

  if (!response) {
    return null;
  }

  try {
    const payload = (await response.clone().json()) as { message?: unknown } | null;

    return typeof payload?.message === 'string' && payload.message.trim()
      ? payload.message
      : null;
  } catch {
    return null;
  }
}

function buildCheckoutTraceError(message: string, trace: string[]) {
  const compactTrace = trace.length > 0 ? `\nEtapas: ${trace.join(' > ')}` : '';
  return new Error(`${message}${compactTrace}`);
}
