import { jsonResponse, noContentResponse } from '../_shared/http.ts'
import {
  createAdminClient,
  fetchStripeConnectAccount,
  type StripeConnectAccountSnapshot,
  upsertStripeConnectSnapshotForAccount,
} from '../_shared/stripe.ts'

type AccountRow = {
  account_type: 'bar' | 'musician'
  id: string
}

type PaymentProfileRow = {
  stripe_connected_account_id: string | null
}

async function ensureAuthenticatedMusician(authorization: string) {
  const admin = createAdminClient()
  const accessToken = authorization.replace(/^Bearer\s+/i, '').trim()
  const {
    data: { user },
    error: userError,
  } = await admin.auth.getUser(accessToken)

  if (userError) {
    throw new Error(`Falha ao validar a sessao do Musico: ${userError.message}`)
  }

  if (!user) {
    throw new Error('Sessao expirada. Entre novamente para seguir.')
  }

  const { data: account, error: accountError } = await admin
    .from('accounts')
    .select('id, account_type')
    .eq('id', user.id)
    .maybeSingle()

  if (accountError) {
    throw accountError
  }

  const accountRecord = account as AccountRow | null

  if (!accountRecord || accountRecord.account_type !== 'musician') {
    throw new Error('A sincronizacao de recebimento Stripe so esta disponivel para contas de Musico.')
  }

  return accountRecord
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return noContentResponse()
  }

  if (request.method !== 'POST' && request.method !== 'GET') {
    return jsonResponse(
      {
        error: 'method_not_allowed',
        message: 'Use GET ou POST para sincronizar a conta Stripe do Musico.',
      },
      { status: 405 },
    )
  }

  const authorization = request.headers.get('authorization')

  if (!authorization) {
    return jsonResponse(
      {
        error: 'missing_authorization',
        message: 'Autenticacao obrigatoria para sincronizar o recebimento Stripe.',
      },
      { status: 401 },
    )
  }

  try {
    const account = await ensureAuthenticatedMusician(authorization)
    const admin = createAdminClient()
    const { data: paymentProfile, error: paymentError } = await admin
      .from('account_payment_profiles')
      .select('stripe_connected_account_id')
      .eq('account_id', account.id)
      .maybeSingle()

    if (paymentError) {
      throw paymentError
    }

    const paymentProfileRecord = paymentProfile as PaymentProfileRow | null
    const connectedAccountId = paymentProfileRecord?.stripe_connected_account_id ?? null

    if (!connectedAccountId) {
      return jsonResponse({
        accountId: null,
        snapshot: {
          accountId: '',
          country: null,
          dashboard: null,
          disabledReason: null,
          payoutsCapabilityStatus: null,
          requirementsDue: [],
          requirementsPending: [],
          status: 'not_started',
          transfersCapabilityStatus: null,
        } satisfies StripeConnectAccountSnapshot,
      })
    }

    const snapshot = await fetchStripeConnectAccount(connectedAccountId)
    await upsertStripeConnectSnapshotForAccount(account.id, snapshot)

    return jsonResponse({
      accountId: connectedAccountId,
      snapshot,
    })
  } catch (error) {
    console.error('stripe-sync-musician-connect-account failed', error)

    return jsonResponse(
      {
        error: 'stripe_connect_sync_failed',
        message:
          error instanceof Error
            ? error.message
            : 'Nao foi possivel sincronizar a conta Stripe do Musico.',
      },
      { status: 400 },
    )
  }
})
