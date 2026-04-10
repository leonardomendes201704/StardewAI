import Stripe from 'npm:stripe@18.3.0'

import { jsonResponse } from '../_shared/http.ts'
import {
  createStripeClient,
  createStripeWebhookCryptoProvider,
  fetchStripeConnectAccount,
  findLocalAccountIdByConnectedStripeAccount,
  getConnectWebhookSecret,
  upsertStripeConnectSnapshotForAccount,
} from '../_shared/stripe.ts'

type StripeThinEvent = {
  id: string
  related_object?: {
    id?: string
    type?: string
    url?: string
  } | null
  type: string
}

function isSupportedConnectThinEvent(type: string) {
  return type.startsWith('v2.core.account')
}

function extractConnectedAccountIdFromSnapshotEvent(event: Stripe.Event) {
  if (typeof event.account === 'string' && event.account.trim().length > 0) {
    return event.account
  }

  if (event.type === 'account.updated') {
    const accountObject = event.data.object as { id?: string } | undefined
    return typeof accountObject?.id === 'string' ? accountObject.id : null
  }

  return null
}

async function syncLocalPaymentProfileByConnectedAccountId(connectedAccountId: string) {
  const localAccountId = await findLocalAccountIdByConnectedStripeAccount(connectedAccountId)

  if (!localAccountId) {
    return {
      connectedAccountId,
      ignored: true,
      reason: 'local_account_not_found',
    } as const
  }

  const snapshot = await fetchStripeConnectAccount(connectedAccountId)
  await upsertStripeConnectSnapshotForAccount(localAccountId, snapshot)

  return {
    connectedAccountId,
    ignored: false,
    localAccountId,
    snapshot,
  } as const
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return jsonResponse(
      {
        error: 'method_not_allowed',
        message: 'Use POST for Stripe connected account webhooks.',
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
    const secret = getConnectWebhookSecret()

    try {
      const thinEvent = ((stripe as unknown as {
        parseThinEvent: (payload: string, signatureHeader: string, endpointSecret: string) => StripeThinEvent
      }).parseThinEvent(body, signature, secret)) as StripeThinEvent

      if (!isSupportedConnectThinEvent(thinEvent.type)) {
        return jsonResponse({
          ignored: true,
          reason: 'unsupported_connect_thin_event',
          receivedEventId: thinEvent.id,
          receivedEventType: thinEvent.type,
        })
      }

      const connectedAccountId = thinEvent.related_object?.id ?? null

      if (!connectedAccountId) {
        return jsonResponse({
          ignored: true,
          reason: 'missing_related_account',
          receivedEventId: thinEvent.id,
          receivedEventType: thinEvent.type,
        })
      }

      const syncResult = await syncLocalPaymentProfileByConnectedAccountId(connectedAccountId)

      return jsonResponse({
        ignored: syncResult.ignored,
        localAccountId: syncResult.ignored ? null : syncResult.localAccountId,
        receivedEventId: thinEvent.id,
        receivedEventType: thinEvent.type,
        stripeConnectedAccountId: connectedAccountId,
      })
    } catch {
      const snapshotEvent = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        secret,
        undefined,
        createStripeWebhookCryptoProvider(),
      )

      if (!['account.updated', 'payout.failed', 'payout.paid'].includes(snapshotEvent.type)) {
        return jsonResponse({
          ignored: true,
          reason: 'unsupported_connect_snapshot_event',
          receivedEventId: snapshotEvent.id,
          receivedEventType: snapshotEvent.type,
        })
      }

      const connectedAccountId = extractConnectedAccountIdFromSnapshotEvent(snapshotEvent)

      if (!connectedAccountId) {
        return jsonResponse({
          ignored: true,
          reason: 'missing_snapshot_account',
          receivedEventId: snapshotEvent.id,
          receivedEventType: snapshotEvent.type,
        })
      }

      const syncResult = await syncLocalPaymentProfileByConnectedAccountId(connectedAccountId)

      return jsonResponse({
        ignored: syncResult.ignored,
        localAccountId: syncResult.ignored ? null : syncResult.localAccountId,
        receivedEventId: snapshotEvent.id,
        receivedEventType: snapshotEvent.type,
        stripeConnectedAccountId: connectedAccountId,
      })
    }
  } catch (error) {
    console.error('stripe-connect-webhook failed', error)

    return jsonResponse(
      {
        error: 'stripe_connect_webhook_failed',
        message:
          error instanceof Error
            ? error.message
            : 'Nao foi possivel processar o webhook de contas conectadas da Stripe.',
      },
      { status: 400 },
    )
  }
})
