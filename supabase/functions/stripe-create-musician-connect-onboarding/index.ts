import { jsonResponse, noContentResponse } from '../_shared/http.ts'
import {
  buildConnectRefreshUrl,
  buildConnectReturnUrl,
  createAdminClient,
  fetchStripeConnectAccount,
  stripeV2Request,
  upsertStripeConnectSnapshotForAccount,
} from '../_shared/stripe.ts'

type AccountRow = {
  account_type: 'bar' | 'musician'
  email: string
  id: string
}

type ArtistProfileRow = {
  stage_name: string | null
}

type PaymentProfileRow = {
  stripe_connected_account_id: string | null
}

type CreateStripeConnectAccountResponse = {
  id: string
}

type CreateStripeConnectAccountLinkResponse = {
  expires_at?: string | null
  url: string
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
    throw new Error('Sessao expirada. Entre novamente para configurar o recebimento.')
  }

  const { data: account, error: accountError } = await admin
    .from('accounts')
    .select('id, email, account_type')
    .eq('id', user.id)
    .maybeSingle()

  if (accountError) {
    throw accountError
  }

  const accountRecord = account as AccountRow | null

  if (!accountRecord || accountRecord.account_type !== 'musician') {
    throw new Error('A configuracao de recebimento Stripe so esta disponivel para contas de Musico.')
  }

  return accountRecord
}

async function createStripeConnectedRecipient(input: {
  email: string
  stageName: string | null
}) {
  return stripeV2Request<CreateStripeConnectAccountResponse>('/v2/core/accounts', {
    body: {
      configuration: {
        merchant: {
          capabilities: {
            card_payments: {
              requested: true,
            },
          },
        },
        recipient: {
          capabilities: {
            stripe_balance: {
              stripe_transfers: {
                requested: true,
              },
            },
          },
        },
      },
      contact_email: input.email,
      dashboard: 'express',
      defaults: {
        responsibilities: {
          fees_collector: 'application',
          losses_collector: 'application',
        },
      },
      display_name: input.stageName ?? undefined,
      identity: {
        country: 'BR',
      },
      include: ['configuration.merchant', 'configuration.recipient', 'identity', 'requirements'],
    },
    method: 'POST',
  })
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return noContentResponse()
  }

  if (request.method !== 'POST') {
    return jsonResponse(
      {
        error: 'method_not_allowed',
        message: 'Use POST para iniciar o onboarding Stripe do Musico.',
      },
      { status: 405 },
    )
  }

  const authorization = request.headers.get('authorization')

  if (!authorization) {
    return jsonResponse(
      {
        error: 'missing_authorization',
        message: 'Autenticacao obrigatoria para configurar o recebimento Stripe.',
      },
      { status: 401 },
    )
  }

  try {
    const account = await ensureAuthenticatedMusician(authorization)
    const admin = createAdminClient()
    const [{ data: artistProfile, error: artistError }, { data: paymentProfile, error: paymentError }] =
      await Promise.all([
        admin.from('artist_profiles').select('stage_name').eq('account_id', account.id).maybeSingle(),
        admin
          .from('account_payment_profiles')
          .select('stripe_connected_account_id')
          .eq('account_id', account.id)
          .maybeSingle(),
      ])

    if (artistError) {
      throw artistError
    }

    if (paymentError) {
      throw paymentError
    }

    const artistProfileRecord = artistProfile as ArtistProfileRow | null
    const paymentProfileRecord = paymentProfile as PaymentProfileRow | null
    let connectedAccountId = paymentProfileRecord?.stripe_connected_account_id ?? null

    if (!connectedAccountId) {
      const createdAccount = await createStripeConnectedRecipient({
        email: account.email,
        stageName: artistProfileRecord?.stage_name ?? null,
      })

      connectedAccountId = createdAccount.id
    }

    const snapshot = await fetchStripeConnectAccount(connectedAccountId)
    await upsertStripeConnectSnapshotForAccount(account.id, snapshot)

    if (snapshot.status === 'ready') {
      return jsonResponse({
        accountId: snapshot.accountId,
        alreadyReady: true,
        onboardingUrl: null,
        snapshot,
      })
    }

    const onboardingLink = await stripeV2Request<CreateStripeConnectAccountLinkResponse>(
      '/v2/core/account_links',
      {
        body: {
          account: snapshot.accountId,
          use_case: {
            account_onboarding: {
              configurations: ['merchant', 'recipient'],
              refresh_url: buildConnectRefreshUrl(),
              return_url: buildConnectReturnUrl(),
            },
            type: 'account_onboarding',
          },
        },
        method: 'POST',
      },
    )

    return jsonResponse({
      accountId: snapshot.accountId,
      alreadyReady: false,
      onboardingExpiresAt: onboardingLink.expires_at ?? null,
      onboardingUrl: onboardingLink.url,
      snapshot,
    })
  } catch (error) {
    console.error('stripe-create-musician-connect-onboarding failed', error)

    return jsonResponse(
      {
        error: 'stripe_connect_onboarding_failed',
        message:
          error instanceof Error
            ? error.message
            : 'Nao foi possivel abrir o onboarding Stripe do Musico.',
      },
      { status: 400 },
    )
  }
})
