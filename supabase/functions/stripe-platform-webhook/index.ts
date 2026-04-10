import Stripe from 'npm:stripe@18.3.0'

import { getRequiredEnv, jsonResponse } from '../_shared/http.ts'
import {
  createAdminClient,
  createStripeClient,
  createStripeWebhookCryptoProvider,
} from '../_shared/stripe.ts'

type PaymentOccurrenceStatus =
  | 'checkout_expired'
  | 'failed'
  | 'funds_held'
  | 'payment_pending'
  | 'refunded'
  | 'transfer_reversed'
  | 'transferred'

type PaymentOccurrenceLookupRow = {
  id: string
}

function buildOccurrencePatch(
  status: PaymentOccurrenceStatus,
  patch: Record<string, unknown> = {},
) {
  return {
    status,
    ...patch,
  }
}

async function findOccurrenceByColumn(column: string, value: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('contract_payment_occurrences')
    .select('id')
    .eq(column, value)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data as PaymentOccurrenceLookupRow | null
}

async function findOccurrenceByMetadata(metadata: Stripe.Metadata | null | undefined) {
  const occurrenceId = metadata?.occurrence_id

  if (!occurrenceId) {
    return null
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('contract_payment_occurrences')
    .select('id')
    .eq('id', occurrenceId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data as PaymentOccurrenceLookupRow | null
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

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const occurrence =
    (await findOccurrenceByMetadata(session.metadata)) ??
    (await findOccurrenceByColumn('stripe_checkout_session_id', session.id))

  if (!occurrence) {
    return
  }

  const paymentIntentId =
    typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null
  const customerId =
    typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null
  const status = session.payment_status === 'paid' ? 'funds_held' : 'payment_pending'

  await updateOccurrence(
    occurrence.id,
    buildOccurrencePatch(status, {
      paid_at: session.payment_status === 'paid' ? new Date().toISOString() : null,
      stripe_checkout_session_id: session.id,
      stripe_customer_id: customerId,
      stripe_payment_intent_id: paymentIntentId,
    }),
  )
}

async function handleCheckoutSessionExpired(session: Stripe.Checkout.Session) {
  const occurrence =
    (await findOccurrenceByMetadata(session.metadata)) ??
    (await findOccurrenceByColumn('stripe_checkout_session_id', session.id))

  if (!occurrence) {
    return
  }

  await updateOccurrence(
    occurrence.id,
    buildOccurrencePatch('checkout_expired', {
      checkout_expires_at: new Date().toISOString(),
      stripe_checkout_session_id: session.id,
    }),
  )
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const occurrence =
    (await findOccurrenceByMetadata(paymentIntent.metadata)) ??
    (await findOccurrenceByColumn('stripe_payment_intent_id', paymentIntent.id))

  if (!occurrence) {
    return
  }

  await updateOccurrence(
    occurrence.id,
    buildOccurrencePatch('funds_held', {
      paid_at: new Date().toISOString(),
      stripe_charge_id:
        typeof paymentIntent.latest_charge === 'string'
          ? paymentIntent.latest_charge
          : paymentIntent.latest_charge?.id ?? null,
      stripe_payment_intent_id: paymentIntent.id,
    }),
  )
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const occurrence =
    (await findOccurrenceByMetadata(paymentIntent.metadata)) ??
    (await findOccurrenceByColumn('stripe_payment_intent_id', paymentIntent.id))

  if (!occurrence) {
    return
  }

  await updateOccurrence(
    occurrence.id,
    buildOccurrencePatch('failed', {
      failed_at: new Date().toISOString(),
      failure_code: paymentIntent.last_payment_error?.code ?? null,
      failure_message: paymentIntent.last_payment_error?.message ?? null,
      stripe_payment_intent_id: paymentIntent.id,
    }),
  )
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId =
    typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id ?? null
  const occurrence =
    (paymentIntentId ? await findOccurrenceByColumn('stripe_payment_intent_id', paymentIntentId) : null) ??
    (await findOccurrenceByMetadata(charge.metadata))

  if (!occurrence) {
    return
  }

  await updateOccurrence(
    occurrence.id,
    buildOccurrencePatch('refunded', {
      refunded_at: new Date().toISOString(),
      stripe_charge_id: charge.id,
    }),
  )
}

async function handleTransferCreated(transfer: Stripe.Transfer) {
  const occurrence = await findOccurrenceByMetadata(transfer.metadata)

  if (!occurrence) {
    return
  }

  await updateOccurrence(
    occurrence.id,
    buildOccurrencePatch('transferred', {
      stripe_transfer_id: transfer.id,
      transferred_at: new Date().toISOString(),
    }),
  )
}

async function handleTransferReversed(transfer: Stripe.Transfer) {
  const occurrence = await findOccurrenceByMetadata(transfer.metadata)

  if (!occurrence) {
    return
  }

  await updateOccurrence(
    occurrence.id,
    buildOccurrencePatch('transfer_reversed', {
      stripe_transfer_id: transfer.id,
    }),
  )
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return jsonResponse(
      {
        error: 'method_not_allowed',
        message: 'Use POST for Stripe webhooks.',
      },
      { status: 405 },
    )
  }

  try {
    const signature = request.headers.get('Stripe-Signature')

    if (!signature) {
      return jsonResponse(
        {
          error: 'missing_signature',
          message: 'Missing Stripe-Signature header.',
        },
        { status: 400 },
      )
    }

    const body = await request.text()
    const stripe = createStripeClient()
    const cryptoProvider = createStripeWebhookCryptoProvider()

    const receivedEvent = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      getRequiredEnv('STRIPE_PLATFORM_WEBHOOK_SECRET'),
      undefined,
      cryptoProvider,
    )

    switch (receivedEvent.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(receivedEvent.data.object as Stripe.Checkout.Session)
        break
      case 'checkout.session.expired':
        await handleCheckoutSessionExpired(receivedEvent.data.object as Stripe.Checkout.Session)
        break
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(receivedEvent.data.object as Stripe.PaymentIntent)
        break
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(receivedEvent.data.object as Stripe.PaymentIntent)
        break
      case 'charge.refunded':
        await handleChargeRefunded(receivedEvent.data.object as Stripe.Charge)
        break
      case 'transfer.created':
        await handleTransferCreated(receivedEvent.data.object as Stripe.Transfer)
        break
      case 'transfer.reversed':
        await handleTransferReversed(receivedEvent.data.object as Stripe.Transfer)
        break
      default:
        break
    }

    return jsonResponse({
      ok: true,
      receivedEventId: receivedEvent.id,
      receivedEventType: receivedEvent.type,
    })
  } catch (error) {
    console.error('stripe-platform-webhook failed', error)

    return jsonResponse(
      {
        error: 'stripe_webhook_failed',
        message:
          error instanceof Error
            ? error.message
            : 'Nao foi possivel processar o webhook da Stripe.',
      },
      { status: 400 },
    )
  }
})
