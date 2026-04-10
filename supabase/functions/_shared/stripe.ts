import Stripe from 'npm:stripe@18.3.0'
import { createClient } from 'jsr:@supabase/supabase-js@2'

import { getOptionalEnv, getRequiredEnv, getRequiredIntEnv } from './http.ts'

export type CheckoutChargeKind = 'single_event' | 'deposit' | 'balance'
export type StripeConnectedAccountStatus =
  | 'not_started'
  | 'onboarding_required'
  | 'pending_review'
  | 'ready'
  | 'restricted'

type StripeV2RecipientConfiguration = {
  capabilities?: {
    stripe_balance?: {
      payouts?: {
        status?: string | null
      } | null
      stripe_transfers?: {
        status?: string | null
      } | null
    } | null
  } | null
}

type StripeV2Requirements = {
  currently_due?: string[] | null
  disabled_reason?: string | null
  past_due?: string[] | null
  pending_verification?: string[] | null
}

type StripeV2AccountResponse = {
  configuration?: {
    recipient?: StripeV2RecipientConfiguration | null
  } | null
  dashboard?: string | null
  display_name?: string | null
  id: string
  identity?: {
    country?: string | null
  } | null
  requirements?: StripeV2Requirements | null
}

export type StripeConnectAccountSnapshot = {
  accountId: string
  country: string | null
  dashboard: string | null
  disabledReason: string | null
  payoutsCapabilityStatus: string | null
  requirementsDue: string[]
  requirementsPending: string[]
  status: StripeConnectedAccountStatus
  transfersCapabilityStatus: string | null
}

const STRIPE_CONNECT_V2_VERSION = '2026-02-25.preview'

export function createAdminClient() {
  return createClient(getRequiredEnv('SUPABASE_URL'), getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export function createUserClient(authorization: string) {
  return createClient(getRequiredEnv('SUPABASE_URL'), getRequiredEnv('SUPABASE_ANON_KEY'), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: authorization,
      },
    },
  })
}

export function createStripeClient() {
  return new Stripe(getRequiredEnv('STRIPE_SECRET_KEY'), {
    apiVersion: '2026-03-25.dahlia',
    appInfo: {
      name: 'TocaAI',
      version: '1.0.0',
    },
    httpClient: Stripe.createFetchHttpClient(),
  })
}

export function createStripeWebhookCryptoProvider() {
  return Stripe.createSubtleCryptoProvider()
}

export function getConnectWebhookSecret() {
  return getRequiredEnv('STRIPE_CONNECT_WEBHOOK_SECRET')
}

export function getPlatformFeeBps() {
  return getRequiredIntEnv('STRIPE_PLATFORM_FEE_BPS')
}

export function buildSuccessUrlTemplate() {
  const baseUrl = getRequiredEnv('STRIPE_CHECKOUT_SUCCESS_URL')

  if (baseUrl.includes('{CHECKOUT_SESSION_ID}')) {
    return baseUrl
  }

  const separator = baseUrl.includes('?') ? '&' : '?'
  return `${baseUrl}${separator}session_id={CHECKOUT_SESSION_ID}`
}

export function buildCancelUrl() {
  return getRequiredEnv('STRIPE_CHECKOUT_CANCEL_URL')
}

function buildUrlFromOrigin(origin: string, searchParam: string) {
  return `${origin}/?${searchParam}`
}

function parseBaseOrigin(rawUrl: string) {
  return new URL(rawUrl).origin
}

export function buildConnectReturnUrl() {
  const explicitUrl = getOptionalEnv('STRIPE_CONNECT_RETURN_URL')

  if (explicitUrl) {
    return explicitUrl
  }

  return buildUrlFromOrigin(parseBaseOrigin(getRequiredEnv('STRIPE_CHECKOUT_SUCCESS_URL')), 'connect=return')
}

export function buildConnectRefreshUrl() {
  const explicitUrl = getOptionalEnv('STRIPE_CONNECT_REFRESH_URL')

  if (explicitUrl) {
    return explicitUrl
  }

  return buildUrlFromOrigin(parseBaseOrigin(getRequiredEnv('STRIPE_CHECKOUT_CANCEL_URL')), 'connect=refresh')
}

export function calculateFeeBreakdown(amountCents: number) {
  const feeBps = getPlatformFeeBps()
  const platformFeeCents = Math.floor((amountCents * feeBps) / 10000)
  const musicianPayoutCents = amountCents - platformFeeCents

  if (amountCents <= 0 || musicianPayoutCents < 0) {
    throw new Error('Invalid payment amount configured for this occurrence.')
  }

  return {
    musicianPayoutCents,
    platformFeeCents,
  }
}

export function normalizeOccurrenceDate(rawDate: unknown, fallbackDate: string) {
  const value = typeof rawDate === 'string' && rawDate.trim().length > 0 ? rawDate.trim() : fallbackDate

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error('Occurrence date must be in YYYY-MM-DD format.')
  }

  return value
}

export function normalizeChargeKind(rawKind: unknown): CheckoutChargeKind {
  if (rawKind === 'deposit' || rawKind === 'balance') {
    return rawKind
  }

  return 'single_event'
}

export function buildReleaseAfterTimestamp(
  occurrenceDate: string,
  startTime: string,
  durationHours: number,
) {
  const [year, month, day] = occurrenceDate.split('-').map((value) => Number.parseInt(value, 10))
  const [hours, minutes, seconds] = startTime.split(':').map((value) => Number.parseInt(value, 10))
  // O MVP opera em horario local do Brasil. Convertemos a hora local para UTC
  // antes de persistir o instante de liberacao financeira.
  const saoPauloUtcOffsetHours = 3
  const releaseAfter = new Date(
    Date.UTC(year, month - 1, day, hours + saoPauloUtcOffsetHours, minutes, seconds || 0),
  )

  releaseAfter.setUTCHours(releaseAfter.getUTCHours() + durationHours)

  return releaseAfter.toISOString()
}

export function stringifyMetadata(metadata: Record<string, string | number | null | undefined>) {
  return Object.entries(metadata).reduce<Record<string, string>>((accumulator, [key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      accumulator[key] = String(value)
    }

    return accumulator
  }, {})
}

function extractUniqueStrings(values: Array<string | null | undefined> | null | undefined) {
  return Array.from(new Set((values ?? []).filter((value): value is string => Boolean(value))))
}

export function normalizeStripeConnectSnapshot(account: StripeV2AccountResponse): StripeConnectAccountSnapshot {
  const requirements = account.requirements ?? null
  const transfersCapabilityStatus =
    account.configuration?.recipient?.capabilities?.stripe_balance?.stripe_transfers?.status ?? null
  const payoutsCapabilityStatus =
    account.configuration?.recipient?.capabilities?.stripe_balance?.payouts?.status ?? null
  const requirementsDue = extractUniqueStrings([
    ...(requirements?.currently_due ?? []),
    ...(requirements?.past_due ?? []),
  ])
  const requirementsPending = extractUniqueStrings(requirements?.pending_verification ?? [])
  const disabledReason = requirements?.disabled_reason ?? null

  let status: StripeConnectedAccountStatus = 'onboarding_required'

  if (disabledReason) {
    status = 'restricted'
  } else if (
    transfersCapabilityStatus === 'active' &&
    (payoutsCapabilityStatus === null || payoutsCapabilityStatus === 'active') &&
    requirementsDue.length === 0
  ) {
    status = 'ready'
  } else if (requirementsPending.length > 0) {
    status = 'pending_review'
  } else {
    status = 'onboarding_required'
  }

  return {
    accountId: account.id,
    country: account.identity?.country ?? null,
    dashboard: account.dashboard ?? null,
    disabledReason,
    payoutsCapabilityStatus,
    requirementsDue,
    requirementsPending,
    status,
    transfersCapabilityStatus,
  }
}

async function parseStripeError(response: Response) {
  const payload = (await response.json().catch(() => null)) as
    | {
        error?: {
          message?: string
        }
      }
    | null

  return payload?.error?.message ?? `Stripe request failed with status ${response.status}.`
}

export async function stripeV2Request<TResponse>(
  path: string,
  options: {
    body?: Record<string, unknown>
    method?: 'GET' | 'POST'
  } = {},
) {
  const response = await fetch(`https://api.stripe.com${path}`, {
    body: options.body ? JSON.stringify(options.body) : undefined,
    headers: {
      Authorization: `Bearer ${getRequiredEnv('STRIPE_SECRET_KEY')}`,
      'Content-Type': 'application/json',
      'Stripe-Version': STRIPE_CONNECT_V2_VERSION,
    },
    method: options.method ?? 'GET',
  })

  if (!response.ok) {
    throw new Error(await parseStripeError(response))
  }

  return (await response.json()) as TResponse
}

export async function fetchStripeConnectAccount(accountId: string) {
  const query = new URLSearchParams()
  const includes = ['configuration.recipient', 'requirements', 'identity']
  includes.forEach((value, index) => {
    query.append(`include[${index}]`, value)
  })

  const account = await stripeV2Request<StripeV2AccountResponse>(
    `/v2/core/accounts/${accountId}?${query.toString()}`,
  )

  return normalizeStripeConnectSnapshot(account)
}

export async function findLocalAccountIdByConnectedStripeAccount(connectedAccountId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('account_payment_profiles')
    .select('account_id')
    .eq('stripe_connected_account_id', connectedAccountId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return (data as { account_id: string } | null)?.account_id ?? null
}

export async function upsertStripeConnectSnapshotForAccount(
  accountId: string,
  snapshot: StripeConnectAccountSnapshot,
  patch: Record<string, unknown> = {},
) {
  const admin = createAdminClient()
  const { error } = await admin.from('account_payment_profiles').upsert(
    {
      account_id: accountId,
      stripe_connect_country: snapshot.country,
      stripe_connect_dashboard: snapshot.dashboard,
      stripe_connected_account_id: snapshot.accountId,
      stripe_connected_account_status: snapshot.status,
      stripe_last_connect_sync_at: new Date().toISOString(),
      stripe_onboarding_completed_at: snapshot.status === 'ready' ? new Date().toISOString() : null,
      stripe_payouts_capability_status: snapshot.payoutsCapabilityStatus,
      stripe_requirements_disabled_reason: snapshot.disabledReason,
      stripe_requirements_due: snapshot.requirementsDue,
      stripe_requirements_pending: snapshot.requirementsPending,
      stripe_transfers_capability_status: snapshot.transfersCapabilityStatus,
      ...patch,
    },
    {
      onConflict: 'account_id',
    },
  )

  if (error) {
    throw error
  }
}
