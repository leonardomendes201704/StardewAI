import { jsonResponse, noContentResponse } from '../_shared/http.ts'
import {
  createAdminClient,
  createStripeClient,
  fetchStripeConnectAccount,
  stringifyMetadata,
  upsertStripeConnectSnapshotForAccount,
} from '../_shared/stripe.ts'

type ReleasePayoutRequest = {
  contractId?: string
  occurrenceDate?: string | null
}

type ContractRow = {
  artist_id: string
  id: string
  status: 'pending_confirmation' | 'confirmed' | 'completed' | 'cancelled'
  venue_id: string
}

type OccurrenceRow = {
  amount_cents: number
  contract_id: string
  currency: string
  id: string
  musician_payout_cents: number
  occurrence_date: string
  status: 'funds_held' | 'transfer_pending' | 'transferred'
  stripe_charge_id: string | null
  stripe_payment_intent_id: string | null
  stripe_transfer_id: string | null
}

type PaymentProfileRow = {
  stripe_connected_account_id: string | null
}

async function ensureContractParticipant(authorization: string, contractId: string) {
  const admin = createAdminClient()
  const accessToken = authorization.replace(/^Bearer\s+/i, '').trim()
  const {
    data: { user },
    error: userError,
  } = await admin.auth.getUser(accessToken)

  if (userError) {
    throw new Error(`Falha ao validar a sessao para liberar o repasse: ${userError.message}`)
  }

  if (!user) {
    throw new Error('Sessao expirada. Entre novamente para seguir com o repasse.')
  }

  const { data: contract, error: contractError } = await admin
    .from('contracts')
    .select('id, venue_id, artist_id, status')
    .eq('id', contractId)
    .maybeSingle()

  if (contractError) {
    throw contractError
  }

  const contractRecord = contract as ContractRow | null

  if (!contractRecord || (contractRecord.artist_id !== user.id && contractRecord.venue_id !== user.id)) {
    throw new Error('Nao foi possivel localizar esta contratacao para liberar o repasse.')
  }

  if (contractRecord.status !== 'completed') {
    throw new Error('O repasse so pode ser liberado depois que o show estiver concluido.')
  }

  return contractRecord
}

async function updateOccurrence(occurrenceId: string, patch: Record<string, unknown>) {
  const admin = createAdminClient()
  const { error } = await admin
    .from('contract_payment_occurrences')
    .update(patch)
    .eq('id', occurrenceId)

  if (error) {
    throw error
  }
}

async function findOccurrence(contractId: string, occurrenceDate?: string | null) {
  const admin = createAdminClient()
  let query = admin
    .from('contract_payment_occurrences')
    .select(
      'id, contract_id, occurrence_date, amount_cents, musician_payout_cents, currency, status, stripe_transfer_id, stripe_payment_intent_id, stripe_charge_id',
    )
    .eq('contract_id', contractId)
    .in('status', ['funds_held', 'transfer_pending', 'transferred'])
    .order('occurrence_date', { ascending: true })
    .limit(1)

  if (occurrenceDate) {
    query = query.eq('occurrence_date', occurrenceDate)
  }

  const { data, error } = await query.maybeSingle()

  if (error) {
    throw error
  }

  return data as OccurrenceRow | null
}

async function resolveSourceTransactionId(
  stripe: ReturnType<typeof createStripeClient>,
  occurrence: OccurrenceRow,
) {
  const storedChargeId = occurrence.stripe_charge_id?.trim()

  if (storedChargeId) {
    return storedChargeId
  }

  const paymentIntentId = occurrence.stripe_payment_intent_id?.trim()

  if (!paymentIntentId) {
    throw new Error(
      'Nao foi possivel liberar o repasse porque esta ocorrencia nao possui um PaymentIntent associado.',
    )
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
  const latestCharge =
    typeof paymentIntent.latest_charge === 'string'
      ? paymentIntent.latest_charge
      : paymentIntent.latest_charge?.id ?? null

  if (latestCharge) {
    return latestCharge
  }

  const charges = await stripe.charges.list({
    limit: 1,
    payment_intent: paymentIntentId,
  })
  const fallbackChargeId = charges.data[0]?.id ?? null

  if (fallbackChargeId) {
    return fallbackChargeId
  }

  throw new Error(
    'Nao foi possivel localizar a charge original deste pagamento para liberar o repasse.',
  )
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return noContentResponse()
  }

  if (request.method !== 'POST') {
    return jsonResponse(
      {
        error: 'method_not_allowed',
        message: 'Use POST para tentar liberar o repasse do Musico.',
      },
      { status: 405 },
    )
  }

  const authorization = request.headers.get('authorization')

  if (!authorization) {
    return jsonResponse(
      {
        error: 'missing_authorization',
        message: 'Autenticacao obrigatoria para liberar o repasse.',
      },
      { status: 401 },
    )
  }

  try {
    const payload = (await request.json()) as ReleasePayoutRequest

    if (!payload.contractId) {
      throw new Error('contractId e obrigatorio para liberar o repasse.')
    }

    const contract = await ensureContractParticipant(authorization, payload.contractId)
    const occurrence = await findOccurrence(contract.id, payload.occurrenceDate)

    if (!occurrence) {
      throw new Error('Nao foi possivel localizar a ocorrencia financeira desta contratacao.')
    }

    if (occurrence.status === 'transferred' && occurrence.stripe_transfer_id) {
      return jsonResponse({
        occurrenceId: occurrence.id,
        status: occurrence.status,
        stripeTransferId: occurrence.stripe_transfer_id,
      })
    }

    const admin = createAdminClient()
    const { data: paymentProfile, error: paymentError } = await admin
      .from('account_payment_profiles')
      .select('stripe_connected_account_id')
      .eq('account_id', contract.artist_id)
      .maybeSingle()

    if (paymentError) {
      throw paymentError
    }

    const paymentProfileRecord = paymentProfile as PaymentProfileRow | null
    const connectedAccountId = paymentProfileRecord?.stripe_connected_account_id ?? null

    if (!connectedAccountId) {
      await updateOccurrence(occurrence.id, {
        failure_message: 'O Musico ainda nao configurou o recebimento Stripe.',
        status: 'transfer_pending',
      })

      return jsonResponse({
        occurrenceId: occurrence.id,
        reason: 'connect_not_started',
        status: 'transfer_pending',
      })
    }

    const connectSnapshot = await fetchStripeConnectAccount(connectedAccountId)
    await upsertStripeConnectSnapshotForAccount(contract.artist_id, connectSnapshot, {
      stripe_last_payout_attempt_at: new Date().toISOString(),
    })

    if (connectSnapshot.status !== 'ready' || connectSnapshot.transfersCapabilityStatus !== 'active') {
      await updateOccurrence(occurrence.id, {
        failure_message: 'O recebimento Stripe do Musico ainda precisa de onboarding ou revisao.',
        status: 'transfer_pending',
      })

      return jsonResponse({
        occurrenceId: occurrence.id,
        reason: 'connect_not_ready',
        status: 'transfer_pending',
      })
    }

    const stripe = createStripeClient()
    const sourceTransactionId = await resolveSourceTransactionId(stripe, occurrence)
    const transfer = await stripe.transfers.create({
      amount: occurrence.musician_payout_cents,
      currency: occurrence.currency,
      destination: connectSnapshot.accountId,
      metadata: stringifyMetadata({
        artist_id: contract.artist_id,
        contract_id: contract.id,
        occurrence_date: occurrence.occurrence_date,
        occurrence_id: occurrence.id,
        venue_id: contract.venue_id,
      }),
      source_transaction: sourceTransactionId,
      transfer_group: `tocaai_contract_${contract.id}`,
    })

    await updateOccurrence(occurrence.id, {
      failure_code: null,
      failure_message: null,
      status: 'transferred',
      stripe_transfer_id: transfer.id,
      transferred_at: new Date().toISOString(),
    })

    return jsonResponse({
      occurrenceId: occurrence.id,
      status: 'transferred',
      stripeTransferId: transfer.id,
    })
  } catch (error) {
    console.error('stripe-release-musician-payout failed', error)

    return jsonResponse(
      {
        error: 'stripe_release_payout_failed',
        message:
          error instanceof Error
            ? error.message
            : 'Nao foi possivel liberar o repasse do Musico.',
      },
      { status: 400 },
    )
  }
})
