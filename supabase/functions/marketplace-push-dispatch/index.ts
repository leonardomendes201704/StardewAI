import { jsonResponse, noContentResponse } from '../_shared/http.ts'
import { createAdminClient } from '../_shared/stripe.ts'

type PushEventType =
  | 'chat_message_received'
  | 'contract_confirmed'
  | 'direct_invite_sent'
  | 'opportunity_application_created'

type DispatchRequest = {
  applicationId?: string | null
  contractId?: string | null
  eventType?: PushEventType
  opportunityId?: string | null
}

type OpportunityApplicationRow = {
  artist_id: string
  id: string
  opportunity_id: string
  source: 'direct_invite' | 'marketplace_apply'
}

type OpportunityRow = {
  id: string
  title: string
  venue_id: string
}

type ContractRow = {
  application_id: string
  artist_id: string
  id: string
  opportunity_id: string
  status: string
  venue_id: string
}

type ChatThreadRow = {
  application_id: string
  artist_id: string
  id: string
  opportunity_id: string
  venue_id: string
}

type ChatMessageRow = {
  body: string
  created_at: string
  id: string
  sender_id: string
}

type ArtistProfileRow = {
  account_id: string
  stage_name: string | null
}

type VenueProfileRow = {
  account_id: string
  venue_name: string | null
}

type NotificationPreferencesRow = {
  notify_chat_message: boolean
  notify_contract_update: boolean
  notify_direct_invite: boolean
  notify_new_application: boolean
  push_enabled: boolean
}

type PushRegistrationRow = {
  expo_push_token: string | null
  id: string
}

type NotificationPreferenceKey =
  | 'notify_chat_message'
  | 'notify_contract_update'
  | 'notify_direct_invite'
  | 'notify_new_application'

type ResolvedNotification = {
  body: string
  eventType: PushEventType
  payload: Record<string, string>
  preferenceKey: NotificationPreferenceKey
  recipientAccountId: string
  route: string
  title: string
}

type ExpoTicketResponse = {
  data?:
    | {
        details?: {
          error?: string
        }
        id?: string
        message?: string
        status?: 'error' | 'ok'
      }
    | Array<{
        details?: {
          error?: string
        }
        id?: string
        message?: string
        status?: 'error' | 'ok'
      }>
}

function getRequestErrorStatus(error: unknown) {
  if (error instanceof Error) {
    if (
      error.message.includes('Authentication') ||
      error.message.includes('Sessao') ||
      error.message.includes('authorization')
    ) {
      return 401
    }

    if (
      error.message.includes('required') ||
      error.message.includes('Nao foi possivel') ||
      error.message.includes('valid') ||
      error.message.includes('unsupported')
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
    throw new Error(`Falha ao validar sessao do usuario na Edge Function: ${error.message}`)
  }

  if (!user) {
    throw new Error('Sessao expirada. Entre novamente para continuar.')
  }

  return user
}

function extractBearerToken(authorization: string) {
  const match = authorization.match(/^Bearer\s+(.+)$/i)

  if (!match?.[1]) {
    throw new Error('Authentication is required to dispatch marketplace push notifications.')
  }

  return match[1].trim()
}

function truncateNotificationBody(value: string, limit = 140) {
  const trimmed = value.trim()

  if (trimmed.length <= limit) {
    return trimmed
  }

  return `${trimmed.slice(0, limit - 3)}...`
}

function isPreferenceEnabled(
  row: NotificationPreferencesRow | null,
  preferenceKey: NotificationPreferenceKey,
) {
  if (!row) {
    return true
  }

  return row.push_enabled && row[preferenceKey]
}

async function fetchNotificationPreferences(admin: ReturnType<typeof createAdminClient>, accountId: string) {
  const { data, error } = await admin
    .from('account_notification_preferences')
    .select('push_enabled, notify_new_application, notify_direct_invite, notify_chat_message, notify_contract_update')
    .eq('account_id', accountId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return (data ?? null) as NotificationPreferencesRow | null
}

async function fetchActiveRegistrations(admin: ReturnType<typeof createAdminClient>, accountId: string) {
  const { data, error } = await admin
    .from('account_push_registrations')
    .select('id, expo_push_token')
    .eq('account_id', accountId)
    .is('disabled_at', null)
    .eq('permission_status', 'granted')
    .not('expo_push_token', 'is', null)
    .order('last_seen_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []) as PushRegistrationRow[]
}

async function fetchArtistDisplayName(admin: ReturnType<typeof createAdminClient>, accountId: string) {
  const { data, error } = await admin
    .from('artist_profiles')
    .select('account_id, stage_name')
    .eq('account_id', accountId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return ((data ?? null) as ArtistProfileRow | null)?.stage_name?.trim() || 'Um musico'
}

async function fetchVenueDisplayName(admin: ReturnType<typeof createAdminClient>, accountId: string) {
  const { data, error } = await admin
    .from('venue_profiles')
    .select('account_id, venue_name')
    .eq('account_id', accountId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return ((data ?? null) as VenueProfileRow | null)?.venue_name?.trim() || 'Um bar'
}

async function resolveNotification(
  admin: ReturnType<typeof createAdminClient>,
  currentUserId: string,
  payload: DispatchRequest,
): Promise<ResolvedNotification> {
  switch (payload.eventType) {
    case 'opportunity_application_created':
      return resolveOpportunityApplicationNotification(admin, currentUserId, payload)
    case 'direct_invite_sent':
      return resolveDirectInviteNotification(admin, currentUserId, payload)
    case 'chat_message_received':
      return resolveChatMessageNotification(admin, currentUserId, payload)
    case 'contract_confirmed':
      return resolveContractConfirmedNotification(admin, currentUserId, payload)
    default:
      throw new Error('Unsupported push event type.')
  }
}

async function resolveOpportunityApplicationNotification(
  admin: ReturnType<typeof createAdminClient>,
  currentUserId: string,
  payload: DispatchRequest,
): Promise<ResolvedNotification> {
  if (!payload.applicationId || !payload.opportunityId) {
    throw new Error('applicationId and opportunityId are required for application notifications.')
  }

  const [{ data: application, error: applicationError }, { data: opportunity, error: opportunityError }] =
    await Promise.all([
      admin
        .from('opportunity_applications')
        .select('id, opportunity_id, artist_id, source')
        .eq('id', payload.applicationId)
        .maybeSingle(),
      admin
        .from('opportunities')
        .select('id, title, venue_id')
        .eq('id', payload.opportunityId)
        .maybeSingle(),
    ])

  if (applicationError) {
    throw applicationError
  }

  if (opportunityError) {
    throw opportunityError
  }

  const applicationRow = application as OpportunityApplicationRow | null
  const opportunityRow = opportunity as OpportunityRow | null

  if (!applicationRow || !opportunityRow || applicationRow.artist_id !== currentUserId) {
    throw new Error('Nao foi possivel localizar a candidatura para disparar esta notificacao.')
  }

  if (applicationRow.source !== 'marketplace_apply') {
    throw new Error('Este evento push so vale para candidaturas normais do marketplace.')
  }

  const artistName = await fetchArtistDisplayName(admin, currentUserId)

  return {
    body: `${artistName} se candidatou para "${opportunityRow.title}".`,
    eventType: 'opportunity_application_created',
    payload: {
      applicationId: applicationRow.id,
      opportunityId: opportunityRow.id,
      route: `/bar/candidates/${opportunityRow.id}`,
    },
    preferenceKey: 'notify_new_application',
    recipientAccountId: opportunityRow.venue_id,
    route: `/bar/candidates/${opportunityRow.id}`,
    title: 'Nova candidatura recebida',
  }
}

async function resolveDirectInviteNotification(
  admin: ReturnType<typeof createAdminClient>,
  currentUserId: string,
  payload: DispatchRequest,
): Promise<ResolvedNotification> {
  if (!payload.applicationId || !payload.opportunityId) {
    throw new Error('applicationId and opportunityId are required for direct invite notifications.')
  }

  const [{ data: application, error: applicationError }, { data: opportunity, error: opportunityError }] =
    await Promise.all([
      admin
        .from('opportunity_applications')
        .select('id, opportunity_id, artist_id, source')
        .eq('id', payload.applicationId)
        .maybeSingle(),
      admin
        .from('opportunities')
        .select('id, title, venue_id')
        .eq('id', payload.opportunityId)
        .maybeSingle(),
    ])

  if (applicationError) {
    throw applicationError
  }

  if (opportunityError) {
    throw opportunityError
  }

  const applicationRow = application as OpportunityApplicationRow | null
  const opportunityRow = opportunity as OpportunityRow | null

  if (!applicationRow || !opportunityRow || opportunityRow.venue_id !== currentUserId) {
    throw new Error('Nao foi possivel localizar o convite para disparar esta notificacao.')
  }

  if (applicationRow.source !== 'direct_invite') {
    throw new Error('Este evento push so vale para convites diretos do Bar.')
  }

  const venueName = await fetchVenueDisplayName(admin, currentUserId)

  return {
    body: `${venueName} enviou um convite para "${opportunityRow.title}".`,
    eventType: 'direct_invite_sent',
    payload: {
      applicationId: applicationRow.id,
      opportunityId: opportunityRow.id,
      route: `/musician/opportunities/${opportunityRow.id}`,
    },
    preferenceKey: 'notify_direct_invite',
    recipientAccountId: applicationRow.artist_id,
    route: `/musician/opportunities/${opportunityRow.id}`,
    title: 'Novo convite recebido',
  }
}

async function resolveChatMessageNotification(
  admin: ReturnType<typeof createAdminClient>,
  currentUserId: string,
  payload: DispatchRequest,
): Promise<ResolvedNotification> {
  if (!payload.applicationId) {
    throw new Error('applicationId is required for chat notifications.')
  }

  const { data: thread, error: threadError } = await admin
    .from('opportunity_chat_threads')
    .select('id, application_id, opportunity_id, venue_id, artist_id')
    .eq('application_id', payload.applicationId)
    .maybeSingle()

  if (threadError) {
    throw threadError
  }

  const threadRow = thread as ChatThreadRow | null

  if (!threadRow || (threadRow.venue_id !== currentUserId && threadRow.artist_id !== currentUserId)) {
    throw new Error('Nao foi possivel localizar a conversa para disparar esta notificacao.')
  }

  const [{ data: latestMessage, error: latestMessageError }, { data: opportunity, error: opportunityError }] =
    await Promise.all([
      admin
        .from('opportunity_chat_messages')
        .select('id, sender_id, body, created_at')
        .eq('thread_id', threadRow.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      admin
        .from('opportunities')
        .select('id, title, venue_id')
        .eq('id', threadRow.opportunity_id)
        .maybeSingle(),
    ])

  if (latestMessageError) {
    throw latestMessageError
  }

  if (opportunityError) {
    throw opportunityError
  }

  const messageRow = latestMessage as ChatMessageRow | null
  const opportunityRow = opportunity as OpportunityRow | null

  if (!messageRow || !opportunityRow || messageRow.sender_id !== currentUserId) {
    throw new Error('Nao foi possivel resolver a ultima mensagem desta conversa.')
  }

  const senderIsVenue = threadRow.venue_id === currentUserId
  const senderName = senderIsVenue
    ? await fetchVenueDisplayName(admin, currentUserId)
    : await fetchArtistDisplayName(admin, currentUserId)
  const recipientAccountId = senderIsVenue ? threadRow.artist_id : threadRow.venue_id

  return {
    body: `${senderName}: ${truncateNotificationBody(messageRow.body)}`,
    eventType: 'chat_message_received',
    payload: {
      applicationId: payload.applicationId,
      opportunityId: opportunityRow.id,
      route: `/chat/application/${payload.applicationId}`,
    },
    preferenceKey: 'notify_chat_message',
    recipientAccountId,
    route: `/chat/application/${payload.applicationId}`,
    title: `Nova mensagem sobre ${opportunityRow.title}`,
  }
}

async function resolveContractConfirmedNotification(
  admin: ReturnType<typeof createAdminClient>,
  currentUserId: string,
  payload: DispatchRequest,
): Promise<ResolvedNotification> {
  if (!payload.contractId) {
    throw new Error('contractId is required for contract confirmation notifications.')
  }

  const { data: contract, error: contractError } = await admin
    .from('contracts')
    .select('id, application_id, opportunity_id, venue_id, artist_id, status')
    .eq('id', payload.contractId)
    .maybeSingle()

  if (contractError) {
    throw contractError
  }

  const contractRow = contract as ContractRow | null

  if (
    !contractRow ||
    (contractRow.artist_id !== currentUserId && contractRow.venue_id !== currentUserId)
  ) {
    throw new Error('Nao foi possivel localizar esta contratacao para o push de confirmacao.')
  }

  const { data: opportunity, error: opportunityError } = await admin
    .from('opportunities')
    .select('id, title, venue_id')
    .eq('id', contractRow.opportunity_id)
    .maybeSingle()

  if (opportunityError) {
    throw opportunityError
  }

  const opportunityRow = opportunity as OpportunityRow | null

  if (!opportunityRow) {
    throw new Error('Nao foi possivel localizar a vaga desta contratacao.')
  }

  const senderIsArtist = contractRow.artist_id === currentUserId
  const senderName = senderIsArtist
    ? await fetchArtistDisplayName(admin, currentUserId)
    : await fetchVenueDisplayName(admin, currentUserId)

  return {
    body: `${senderName} confirmou o show "${opportunityRow.title}".`,
    eventType: 'contract_confirmed',
    payload: {
      applicationId: contractRow.application_id,
      contractId: contractRow.id,
      opportunityId: opportunityRow.id,
      route: senderIsArtist
        ? `/bar/candidate/${contractRow.application_id}`
        : `/musician/opportunities/${opportunityRow.id}`,
    },
    preferenceKey: 'notify_contract_update',
    recipientAccountId: senderIsArtist ? contractRow.venue_id : contractRow.artist_id,
    route: senderIsArtist
      ? `/bar/candidate/${contractRow.application_id}`
      : `/musician/opportunities/${opportunityRow.id}`,
    title: 'Contratacao confirmada',
  }
}

async function logNotificationDelivery(
  admin: ReturnType<typeof createAdminClient>,
  payload: {
    errorMessage?: string | null
    eventType: PushEventType
    providerTicketId?: string | null
    recipientAccountId: string
    registrationId?: string | null
    route: string
    status: 'error' | 'sent' | 'skipped'
    body: string
    title: string
    notificationPayload: Record<string, string>
  },
) {
  const { error } = await admin.from('push_notification_deliveries').insert({
    error_message: payload.errorMessage ?? null,
    event_type: payload.eventType,
    payload: payload.notificationPayload,
    provider_ticket_id: payload.providerTicketId ?? null,
    recipient_account_id: payload.recipientAccountId,
    registration_id: payload.registrationId ?? null,
    route: payload.route,
    sent_at: payload.status === 'sent' ? new Date().toISOString() : null,
    status: payload.status,
    body: payload.body,
    title: payload.title,
  })

  if (error) {
    throw error
  }
}

async function markRegistrationAsDisabled(
  admin: ReturnType<typeof createAdminClient>,
  registrationId: string,
) {
  const { error } = await admin
    .from('account_push_registrations')
    .update({
      disabled_at: new Date().toISOString(),
      expo_push_token: null,
    })
    .eq('id', registrationId)

  if (error) {
    throw error
  }
}

async function sendExpoPushMessage(
  registration: PushRegistrationRow,
  notification: ResolvedNotification,
) {
  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    body: JSON.stringify({
      body: notification.body,
      channelId: 'marketplace',
      data: {
        ...notification.payload,
        route: notification.route,
      },
      priority: 'high',
      sound: 'default',
      title: notification.title,
      to: registration.expo_push_token,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })

  const payload = (await response.json().catch(() => null)) as ExpoTicketResponse | null
  const ticket = Array.isArray(payload?.data) ? payload?.data[0] : payload?.data

  if (!response.ok) {
    return {
      errorCode: ticket?.details?.error ?? null,
      errorMessage: ticket?.message ?? `Expo push send failed with status ${response.status}.`,
      providerTicketId: ticket?.id ?? null,
      status: 'error' as const,
    }
  }

  if (ticket?.status === 'error') {
    return {
      errorCode: ticket.details?.error ?? null,
      errorMessage: ticket.message ?? 'Expo push rejected this notification payload.',
      providerTicketId: ticket.id ?? null,
      status: 'error' as const,
    }
  }

  return {
    errorCode: null,
    errorMessage: null,
    providerTicketId: ticket?.id ?? null,
    status: 'sent' as const,
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return noContentResponse()
  }

  if (request.method !== 'POST') {
    return jsonResponse(
      {
        error: 'method_not_allowed',
        message: 'Use POST to dispatch marketplace push notifications.',
      },
      { status: 405 },
    )
  }

  const authorization = request.headers.get('authorization')

  if (!authorization) {
    return jsonResponse(
      {
        error: 'missing_authorization',
        message: 'Authentication is required to dispatch push notifications.',
      },
      { status: 401 },
    )
  }

  try {
    const body = (await request.json()) as DispatchRequest

    if (!body.eventType) {
      throw new Error('eventType is required to dispatch a marketplace push notification.')
    }

    const currentUser = await ensureAuthenticatedUser(authorization)
    const admin = createAdminClient()
    const notification = await resolveNotification(admin, currentUser.id, body)
    const preferenceRow = await fetchNotificationPreferences(admin, notification.recipientAccountId)

    if (!isPreferenceEnabled(preferenceRow, notification.preferenceKey)) {
      await logNotificationDelivery(admin, {
        body: notification.body,
        errorMessage: 'Recipient opted out of this push category.',
        eventType: notification.eventType,
        notificationPayload: notification.payload,
        recipientAccountId: notification.recipientAccountId,
        route: notification.route,
        status: 'skipped',
        title: notification.title,
      })

      return jsonResponse({
        dispatched: 0,
        reason: 'recipient_opted_out',
        status: 'skipped',
      })
    }

    const registrations = await fetchActiveRegistrations(admin, notification.recipientAccountId)

    if (registrations.length === 0) {
      await logNotificationDelivery(admin, {
        body: notification.body,
        errorMessage: 'No active Expo push registrations for recipient.',
        eventType: notification.eventType,
        notificationPayload: notification.payload,
        recipientAccountId: notification.recipientAccountId,
        route: notification.route,
        status: 'skipped',
        title: notification.title,
      })

      return jsonResponse({
        dispatched: 0,
        reason: 'no_active_registrations',
        status: 'skipped',
      })
    }

    let dispatched = 0
    const errors: string[] = []

    for (const registration of registrations) {
      const delivery = await sendExpoPushMessage(registration, notification)

      await logNotificationDelivery(admin, {
        body: notification.body,
        errorMessage: delivery.errorMessage,
        eventType: notification.eventType,
        notificationPayload: notification.payload,
        providerTicketId: delivery.providerTicketId,
        recipientAccountId: notification.recipientAccountId,
        registrationId: registration.id,
        route: notification.route,
        status: delivery.status,
        title: notification.title,
      })

      if (delivery.status === 'sent') {
        dispatched += 1
        continue
      }

      if (delivery.errorCode === 'DeviceNotRegistered') {
        await markRegistrationAsDisabled(admin, registration.id)
      }

      if (delivery.errorMessage) {
        errors.push(delivery.errorMessage)
      }
    }

    return jsonResponse({
      dispatched,
      errors,
      status: dispatched > 0 ? 'sent' : 'error',
    })
  } catch (error) {
    console.error('marketplace-push-dispatch failed', error)

    return jsonResponse(
      {
        error: 'marketplace_push_dispatch_failed',
        message:
          error instanceof Error
            ? error.message
            : 'Nao foi possivel processar esta notificacao do marketplace.',
      },
      {
        status: getRequestErrorStatus(error),
      },
    )
  }
})
