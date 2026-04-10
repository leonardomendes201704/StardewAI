import { jsonResponse, noContentResponse } from '../_shared/http.ts'
import {
  buildCancelUrl,
  buildReleaseAfterTimestamp,
  buildSuccessUrlTemplate,
  calculateFeeBreakdown,
  createAdminClient,
  createStripeClient,
  normalizeChargeKind,
  normalizeOccurrenceDate,
  stringifyMetadata,
  type CheckoutChargeKind,
} from '../_shared/stripe.ts'

type CreateCheckoutRequest = {
  chargeKind?: CheckoutChargeKind
  contractId?: string
  occurrenceDate?: string | null
}

type ContractRow = {
  artist_id: string
  id: string
  opportunity_id: string
  status: 'pending_confirmation' | 'confirmed' | 'completed' | 'cancelled'
  venue_id: string
}

type OpportunityRow = {
  budget_cents: number | null
  city: string
  duration_hours: number
  event_date: string
  id: string
  location_label: string
  recurrence_days: string[]
  start_time: string
  state: string
  title: string
}

type AccountRow = {
  email: string
}

type VenueProfileRow = {
  venue_name: string | null
}

type AccountPaymentProfileRow = {
  account_id: string
  stripe_customer_id: string | null
}

type ContractPaymentOccurrenceRow = {
  amount_cents: number
  charge_kind: CheckoutChargeKind
  checkout_expires_at: string | null
  id: string
  occurrence_date: string
  status: string
  stripe_checkout_session_id: string | null
}

function getRequestErrorStatus(error: unknown) {
  if (error instanceof Error) {
    if (
      error.message.includes('Sessao expirada') ||
      error.message.includes('Authentication') ||
      error.message.includes('authorization')
    ) {
      return 401
    }

    if (
      error.message.includes('Nao foi possivel') ||
      error.message.includes('must be') ||
      error.message.includes('valid') ||
      error.message.includes('required') ||
      error.message.includes('so pode') ||
      error.message.includes('not supported')
    ) {
      return 400
    }
  }

  return 500
}

async function ensureAuthenticatedUser(authorization: string) {
  const accessToken = extractBearerToken(authorization)
  const admin = createAdminClient()
  const {
    data: { user },
    error,
  } = await admin.auth.getUser(accessToken)

  if (error) {
    throw new Error(`Falha ao validar sessao do Bar na Edge Function: ${error.message}`)
  }

  if (!user) {
    throw new Error('Sessao expirada. Entre novamente para seguir com o pagamento.')
  }

  return user
}

function extractBearerToken(authorization: string) {
  const match = authorization.match(/^Bearer\s+(.+)$/i)

  if (!match?.[1]) {
    throw new Error('Authentication is required to create a Checkout session.')
  }

  return match[1].trim()
}

function canReuseCheckoutOccurrence(occurrence: ContractPaymentOccurrenceRow | null) {
  if (!occurrence?.stripe_checkout_session_id || !occurrence.checkout_expires_at) {
    return false
  }

  if (occurrence.status !== 'checkout_open') {
    return false
  }

  return new Date(occurrence.checkout_expires_at).getTime() > Date.now()
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return noContentResponse()
  }

  if (request.method !== 'POST') {
    return jsonResponse(
      {
        error: 'method_not_allowed',
        message: 'Use POST to create a Stripe Checkout session.',
      },
      { status: 405 },
    )
  }

  const authorization = request.headers.get('authorization')

  if (!authorization) {
    return jsonResponse(
      {
        error: 'missing_authorization',
        message: 'Authentication is required to create a Checkout session.',
      },
      { status: 401 },
    )
  }

  try {
    const payload = (await request.json()) as CreateCheckoutRequest

    if (!payload.contractId) {
      throw new Error('contractId is required to create a Checkout session.')
    }

    const chargeKind = normalizeChargeKind(payload.chargeKind)

    if (chargeKind !== 'single_event') {
      throw new Error(
        'Deposit and balance flows are planned, but this foundation currently opens Checkout only for a full single occurrence.',
      )
    }

    const currentUser = await ensureAuthenticatedUser(authorization)
    const admin = createAdminClient()
    const stripe = createStripeClient()

    const { data: contract, error: contractError } = await admin
      .from('contracts')
      .select('id, opportunity_id, venue_id, artist_id, status')
      .eq('id', payload.contractId)
      .maybeSingle()

    if (contractError) {
      throw contractError
    }

    const contractRecord = contract as ContractRow | null

    if (!contractRecord || contractRecord.venue_id !== currentUser.id) {
      throw new Error('Nao foi possivel localizar esta contratacao para o pagamento do Bar.')
    }

    if (contractRecord.status !== 'confirmed') {
      throw new Error('A cobranca so pode ser aberta depois que a contratacao estiver confirmada.')
    }

    const { data: opportunity, error: opportunityError } = await admin
      .from('opportunities')
      .select(
        'id, title, event_date, start_time, duration_hours, budget_cents, location_label, city, state, recurrence_days',
      )
      .eq('id', contractRecord.opportunity_id)
      .maybeSingle()

    if (opportunityError) {
      throw opportunityError
    }

    const opportunityRecord = opportunity as OpportunityRow | null

    if (!opportunityRecord) {
      throw new Error('Nao foi possivel localizar os dados da vaga desta contratacao.')
    }

    if (!opportunityRecord.budget_cents || opportunityRecord.budget_cents <= 0) {
      throw new Error('Esta contratacao ainda nao possui um valor apto para cobranca.')
    }

    const { data: account, error: accountError } = await admin
      .from('accounts')
      .select('email')
      .eq('id', currentUser.id)
      .maybeSingle()

    if (accountError) {
      throw accountError
    }

    const accountRecord = account as AccountRow | null

    if (!accountRecord?.email) {
      throw new Error('Nao foi possivel identificar o email de cobranca desta conta.')
    }

    const { data: venueProfile, error: venueProfileError } = await admin
      .from('venue_profiles')
      .select('venue_name')
      .eq('account_id', currentUser.id)
      .maybeSingle()

    if (venueProfileError) {
      throw venueProfileError
    }

    const venueProfileRecord = venueProfile as VenueProfileRow | null
    const occurrenceDate = normalizeOccurrenceDate(payload.occurrenceDate, opportunityRecord.event_date)
    const feeBreakdown = calculateFeeBreakdown(opportunityRecord.budget_cents)

    const { data: existingPaymentProfile, error: paymentProfileError } = await admin
      .from('account_payment_profiles')
      .select('account_id, stripe_customer_id')
      .eq('account_id', currentUser.id)
      .maybeSingle()

    if (paymentProfileError) {
      throw paymentProfileError
    }

    const paymentProfile = existingPaymentProfile as AccountPaymentProfileRow | null
    let stripeCustomerId = paymentProfile?.stripe_customer_id ?? null

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: accountRecord.email,
        metadata: stringifyMetadata({
          account_id: currentUser.id,
          account_type: 'bar',
        }),
        name: venueProfileRecord?.venue_name ?? undefined,
      })

      stripeCustomerId = customer.id

      const { error: upsertPaymentProfileError } = await admin.from('account_payment_profiles').upsert(
        {
          account_id: currentUser.id,
          billing_email: accountRecord.email,
          stripe_customer_id: stripeCustomerId,
        },
        {
          onConflict: 'account_id',
        },
      )

      if (upsertPaymentProfileError) {
        throw upsertPaymentProfileError
      }
    }

    const { data: existingOccurrence, error: existingOccurrenceError } = await admin
      .from('contract_payment_occurrences')
      .select(
        'id, occurrence_date, charge_kind, status, stripe_checkout_session_id, checkout_expires_at, amount_cents',
      )
      .eq('contract_id', contractRecord.id)
      .eq('occurrence_date', occurrenceDate)
      .eq('charge_kind', chargeKind)
      .maybeSingle()

    if (existingOccurrenceError) {
      throw existingOccurrenceError
    }

    const existingOccurrenceRecord = existingOccurrence as ContractPaymentOccurrenceRow | null

    if (canReuseCheckoutOccurrence(existingOccurrenceRecord)) {
      const existingSession = await stripe.checkout.sessions.retrieve(
        existingOccurrenceRecord.stripe_checkout_session_id!,
      )

      if (existingSession.url) {
        return jsonResponse({
          amountCents: existingOccurrenceRecord.amount_cents,
          checkoutUrl: existingSession.url,
          occurrenceDate,
          occurrenceId: existingOccurrenceRecord.id,
          platformFeeCents: feeBreakdown.platformFeeCents,
          reusedSession: true,
          status: existingOccurrenceRecord.status,
        })
      }
    }

    const releaseAfter = buildReleaseAfterTimestamp(
      occurrenceDate,
      opportunityRecord.start_time,
      opportunityRecord.duration_hours,
    )

    const { data: preparedOccurrence, error: preparedOccurrenceError } = await admin
      .from('contract_payment_occurrences')
      .upsert(
        {
          amount_cents: opportunityRecord.budget_cents,
          artist_id: contractRecord.artist_id,
          charge_kind: chargeKind,
          contract_id: contractRecord.id,
          currency: 'brl',
          due_at: null,
          musician_payout_cents: feeBreakdown.musicianPayoutCents,
          occurrence_date: occurrenceDate,
          opportunity_id: contractRecord.opportunity_id,
          platform_fee_cents: feeBreakdown.platformFeeCents,
          release_after: releaseAfter,
          status: 'draft',
          stripe_customer_id: stripeCustomerId,
          venue_id: contractRecord.venue_id,
        },
        {
          onConflict: 'contract_id,occurrence_date,charge_kind',
        },
      )
      .select('id')
      .single()

    if (preparedOccurrenceError) {
      throw preparedOccurrenceError
    }

    const occurrenceId = preparedOccurrence.id as string
    const stripeMetadata = stringifyMetadata({
      artist_id: contractRecord.artist_id,
      charge_kind: chargeKind,
      contract_id: contractRecord.id,
      occurrence_date: occurrenceDate,
      occurrence_id: occurrenceId,
      opportunity_id: contractRecord.opportunity_id,
      venue_id: contractRecord.venue_id,
    })

    const session = await stripe.checkout.sessions.create({
      cancel_url: buildCancelUrl(),
      client_reference_id: occurrenceId,
      customer: stripeCustomerId,
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              description: `${opportunityRecord.location_label} - ${opportunityRecord.city}/${opportunityRecord.state}`,
              name: `${opportunityRecord.title} - ${occurrenceDate}`,
            },
            unit_amount: opportunityRecord.budget_cents,
          },
          quantity: 1,
        },
      ],
      metadata: stripeMetadata,
      mode: 'payment',
      payment_intent_data: {
        metadata: stripeMetadata,
        setup_future_usage: 'off_session',
      },
      success_url: buildSuccessUrlTemplate(),
    })

    const { error: finalizeOccurrenceError } = await admin
      .from('contract_payment_occurrences')
      .update({
        checkout_expires_at: session.expires_at
          ? new Date(session.expires_at * 1000).toISOString()
          : null,
        metadata: stripeMetadata,
        status: 'checkout_open',
        stripe_checkout_session_id: session.id,
      })
      .eq('id', occurrenceId)

    if (finalizeOccurrenceError) {
      throw finalizeOccurrenceError
    }

    const { error: updatePaymentProfileError } = await admin
      .from('account_payment_profiles')
      .update({
        billing_email: accountRecord.email,
        last_checkout_at: new Date().toISOString(),
      })
      .eq('account_id', currentUser.id)

    if (updatePaymentProfileError) {
      throw updatePaymentProfileError
    }

    return jsonResponse({
      amountCents: opportunityRecord.budget_cents,
      chargeKind,
      checkoutUrl: session.url,
      musicianPayoutCents: feeBreakdown.musicianPayoutCents,
      occurrenceDate,
      occurrenceId,
      platformFeeCents: feeBreakdown.platformFeeCents,
      status: 'checkout_open',
    })
  } catch (error) {
    console.error('stripe-create-platform-checkout failed', error)

    return jsonResponse(
      {
        error: 'checkout_session_creation_failed',
        message:
          error instanceof Error
            ? error.message
            : 'Nao foi possivel abrir a sessao de pagamento desta contratacao.',
      },
      {
        status: getRequestErrorStatus(error),
      },
    )
  }
})
