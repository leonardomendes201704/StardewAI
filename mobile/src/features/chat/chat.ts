import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchContractsByApplicationIds,
  formatContractStatusLabel,
} from '@/src/features/contracts/contracts';
import { notifyMarketplacePushEvent } from '@/src/features/notifications/notifications';
import { reportTelemetryEvent } from '@/src/features/observability/telemetry';
import { type AccountType } from '@/src/features/session/account';
import { supabase } from '@/src/shared/api/supabase/client';

type ChatThreadRow = {
  application_id: string;
  artist_id: string;
  created_at: string;
  id: string;
  opportunity_id: string;
  updated_at: string;
  venue_id: string;
};

type ChatMessageRow = {
  body: string;
  created_at: string;
  id: string;
  sender_id: string;
  thread_id: string;
};

type ChatOpportunityRow = {
  artist_category: string | null;
  city: string;
  duration_hours: number;
  event_date: string;
  id: string;
  recurrence_days: string[];
  start_time: string;
  state: string;
  title: string;
};

type ChatVenueRow = {
  account_id: string;
  city: string | null;
  cover_image_url: string | null;
  state: string | null;
  venue_name: string | null;
};

type ChatArtistRow = {
  account_id: string;
  city: string | null;
  stage_name: string | null;
  state: string | null;
};

type ChatArtistMediaRow = {
  artist_id: string;
  created_at: string;
  public_url: string;
  sort_order: number;
};

type ChatApplicationRow = {
  created_at: string;
  id: string;
  source: 'marketplace_apply' | 'direct_invite';
  status: string;
};

export type ChatInboxItem = {
  applicationId: string;
  chatContextLabel: string;
  counterpartImageUrl: string | null;
  counterpartMeta: string | null;
  counterpartName: string;
  lastMessageAt: string;
  lastMessagePreview: string;
  lastSenderId: string | null;
  opportunityId: string;
  opportunityTitle: string;
  scheduleLabel: string;
  threadId: string;
};

export type ChatMessage = {
  body: string;
  createdAt: string;
  id: string;
  isOwn: boolean;
  senderId: string;
};

export type ChatThreadDetail = {
  applicationId: string;
  chatContextLabel: string;
  counterpartImageUrl: string | null;
  counterpartMeta: string | null;
  counterpartName: string;
  messages: ChatMessage[];
  opportunityId: string;
  opportunityTitle: string;
  scheduleLabel: string;
  statusLabel: string;
  threadId: string;
};

async function requireAuthenticatedUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error('Sessao expirada. Entre novamente para acessar a conversa.');
  }

  return user.id;
}

async function fetchChatInbox(accountType: AccountType): Promise<ChatInboxItem[]> {
  const userId = await requireAuthenticatedUserId();
  const roleColumn = accountType === 'bar' ? 'venue_id' : 'artist_id';

  const { data: threads, error: threadError } = await supabase
    .from('opportunity_chat_threads')
    .select('id, application_id, opportunity_id, venue_id, artist_id, created_at, updated_at')
    .eq(roleColumn, userId)
    .order('updated_at', { ascending: false });

  if (threadError) {
    throw threadError;
  }

  const threadRows = (threads ?? []) as ChatThreadRow[];

  if (threadRows.length === 0) {
    return [];
  }

  const opportunityIds = Array.from(new Set(threadRows.map((thread) => thread.opportunity_id)));
  const applicationIds = Array.from(new Set(threadRows.map((thread) => thread.application_id)));
  const counterpartIds = Array.from(
    new Set(
      threadRows.map((thread) => (accountType === 'bar' ? thread.artist_id : thread.venue_id)),
    ),
  );

  const [
    opportunityMap,
    latestMessageMap,
    applicationMap,
    contractMap,
    counterpartMap,
  ] = await Promise.all([
    fetchChatOpportunitiesByIds(opportunityIds),
    fetchLatestMessagesByThreadIds(threadRows.map((thread) => thread.id)),
    fetchApplicationsByIds(applicationIds),
    fetchContractsByApplicationIds(applicationIds),
    fetchChatCounterpartMap(accountType, counterpartIds),
  ]);

  return threadRows
    .map((thread) => {
      const opportunity = opportunityMap.get(thread.opportunity_id);

      if (!opportunity) {
        return null;
      }

      const counterpartId = accountType === 'bar' ? thread.artist_id : thread.venue_id;
      const counterpart = counterpartMap.get(counterpartId);
      const latestMessage = latestMessageMap.get(thread.id);
      const application = applicationMap.get(thread.application_id);
      const contract = contractMap.get(thread.application_id) ?? null;
      const fallbackPreview =
        application?.source === 'direct_invite'
          ? accountType === 'bar'
            ? 'Este convite abriu um canal direto para negociar com o musico.'
            : 'Este convite abriu um canal direto para negociar com o Bar.'
          : accountType === 'bar'
            ? 'A candidatura abriu este canal para conversar com o musico.'
            : 'Sua candidatura abriu este canal para conversar com o Bar.';

      return {
        applicationId: thread.application_id,
        chatContextLabel: contract
          ? buildContractContextLabel(contract.status)
          : application
            ? `${application.source === 'direct_invite' ? 'Convite' : 'Candidatura'} ${formatApplicationStatusLabel(application.status, application.source).toLowerCase()} em ${formatDateTimeLabel(application.created_at)}`
            : 'Conversa contextual da vaga',
        counterpartImageUrl: counterpart?.imageUrl ?? null,
        counterpartMeta: counterpart?.meta ?? null,
        counterpartName:
          counterpart?.name ??
          (accountType === 'bar' ? 'Musico sem identificacao' : 'Bar sem identificacao'),
        lastMessageAt: latestMessage?.created_at ?? thread.updated_at,
        lastMessagePreview: latestMessage?.body.trim() || fallbackPreview,
        lastSenderId: latestMessage?.sender_id ?? null,
        opportunityId: opportunity.id,
        opportunityTitle: opportunity.title,
        scheduleLabel: formatChatOpportunityScheduleLabel(opportunity),
        threadId: thread.id,
      } satisfies ChatInboxItem;
    })
    .filter((item): item is ChatInboxItem => Boolean(item))
    .sort((left, right) => right.lastMessageAt.localeCompare(left.lastMessageAt));
}

async function fetchChatThreadDetail({
  accountType,
  applicationId,
}: {
  accountType: AccountType;
  applicationId: string;
}): Promise<ChatThreadDetail> {
  const userId = await requireAuthenticatedUserId();
  const roleColumn = accountType === 'bar' ? 'venue_id' : 'artist_id';

  const { data: thread, error: threadError } = await supabase
    .from('opportunity_chat_threads')
    .select('id, application_id, opportunity_id, venue_id, artist_id, created_at, updated_at')
    .eq('application_id', applicationId)
    .eq(roleColumn, userId)
    .maybeSingle();

  if (threadError) {
    throw threadError;
  }

  if (!thread) {
    throw new Error('Nao foi possivel encontrar esta conversa para sua conta.');
  }

  const threadRow = thread as ChatThreadRow;
  const counterpartId = accountType === 'bar' ? threadRow.artist_id : threadRow.venue_id;
  const [
    opportunityMap,
    counterpartMap,
    messages,
    applicationMap,
    contractMap,
  ] = await Promise.all([
    fetchChatOpportunitiesByIds([threadRow.opportunity_id]),
    fetchChatCounterpartMap(accountType, [counterpartId]),
    fetchMessagesByThreadId(threadRow.id, userId),
    fetchApplicationsByIds([applicationId]),
    fetchContractsByApplicationIds([applicationId]),
  ]);

  const opportunity = opportunityMap.get(threadRow.opportunity_id);

  if (!opportunity) {
    throw new Error('O contexto desta vaga nao foi encontrado.');
  }

  const counterpart = counterpartMap.get(counterpartId);
  const application = applicationMap.get(applicationId);
  const contract = contractMap.get(applicationId) ?? null;

  return {
    applicationId,
    chatContextLabel: contract
      ? buildContractContextLabel(contract.status)
      : application
        ? `${application.source === 'direct_invite' ? 'Convite' : 'Candidatura'} ${formatApplicationStatusLabel(application.status, application.source).toLowerCase()}`
        : 'Conversa contextual da vaga',
    counterpartImageUrl: counterpart?.imageUrl ?? null,
    counterpartMeta: counterpart?.meta ?? null,
    counterpartName:
      counterpart?.name ??
      (accountType === 'bar' ? 'Musico sem identificacao' : 'Bar sem identificacao'),
    messages,
    opportunityId: opportunity.id,
    opportunityTitle: opportunity.title,
    scheduleLabel: formatChatOpportunityScheduleLabel(opportunity),
    statusLabel: contract
      ? formatContractStatusLabel(contract.status)
      : application
        ? formatApplicationStatusLabel(application.status, application.source)
        : 'Conversa ativa',
    threadId: threadRow.id,
  };
}

async function fetchChatOpportunitiesByIds(opportunityIds: string[]) {
  const { data, error } = await supabase
    .from('opportunities')
    .select('id, title, event_date, start_time, duration_hours, recurrence_days, city, state, artist_category')
    .in('id', opportunityIds);

  if (error) {
    throw error;
  }

  return new Map((data ?? []).map((row) => [row.id, row as ChatOpportunityRow]));
}

async function fetchLatestMessagesByThreadIds(threadIds: string[]) {
  const { data, error } = await supabase
    .from('opportunity_chat_messages')
    .select('id, thread_id, sender_id, body, created_at')
    .in('thread_id', threadIds)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  const latestMessageMap = new Map<string, ChatMessageRow>();

  for (const row of (data ?? []) as ChatMessageRow[]) {
    if (!latestMessageMap.has(row.thread_id)) {
      latestMessageMap.set(row.thread_id, row);
    }
  }

  return latestMessageMap;
}

async function fetchApplicationsByIds(applicationIds: string[]) {
  const { data, error } = await supabase
    .from('opportunity_applications')
    .select('id, created_at, source, status')
    .in('id', applicationIds);

  if (error) {
    throw error;
  }

  return new Map((data ?? []).map((row) => [row.id, row as ChatApplicationRow]));
}

async function fetchChatCounterpartMap(accountType: AccountType, counterpartIds: string[]) {
  if (accountType === 'musician') {
    const { data, error } = await supabase
      .from('venue_profiles')
      .select('account_id, venue_name, cover_image_url, city, state')
      .in('account_id', counterpartIds);

    if (error) {
      throw error;
    }

    return new Map(
      ((data ?? []) as ChatVenueRow[]).map((row) => [
        row.account_id,
        {
          imageUrl: row.cover_image_url ?? null,
          meta: [row.city, row.state].filter(Boolean).join('/') || null,
          name: row.venue_name?.trim() || 'Bar sem nome',
        },
      ]),
    );
  }

  const [{ data: artists, error: artistsError }, { data: media, error: mediaError }] =
    await Promise.all([
      supabase
        .from('artist_profiles')
        .select('account_id, stage_name, city, state')
        .in('account_id', counterpartIds),
      supabase
        .from('artist_media_assets')
        .select('artist_id, public_url, sort_order, created_at')
        .in('artist_id', counterpartIds)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true }),
    ]);

  if (artistsError) {
    throw artistsError;
  }

  if (mediaError) {
    throw mediaError;
  }

  const mediaMap = new Map<string, string>();

  for (const row of (media ?? []) as ChatArtistMediaRow[]) {
    if (!mediaMap.has(row.artist_id)) {
      mediaMap.set(row.artist_id, row.public_url);
    }
  }

  return new Map(
    ((artists ?? []) as ChatArtistRow[]).map((row) => [
      row.account_id,
      {
        imageUrl: mediaMap.get(row.account_id) ?? null,
        meta: [row.city, row.state].filter(Boolean).join('/') || null,
        name: row.stage_name?.trim() || 'Musico sem nome',
      },
    ]),
  );
}

async function fetchMessagesByThreadId(threadId: string, currentUserId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('opportunity_chat_messages')
    .select('id, thread_id, sender_id, body, created_at')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as ChatMessageRow[]).map((row) => ({
    body: row.body.trim(),
    createdAt: row.created_at,
    id: row.id,
    isOwn: row.sender_id === currentUserId,
    senderId: row.sender_id,
  }));
}

async function sendChatMessage({
  applicationId,
  body,
}: {
  applicationId: string;
  body: string;
}) {
  const trimmedBody = body.trim();

  if (!trimmedBody) {
    throw new Error('Digite uma mensagem antes de enviar.');
  }

  const userId = await requireAuthenticatedUserId();
  const { data: thread, error: threadError } = await supabase
    .from('opportunity_chat_threads')
    .select('id')
    .eq('application_id', applicationId)
    .maybeSingle();

  if (threadError) {
    throw threadError;
  }

  if (!thread) {
    throw new Error('Nao foi possivel localizar a thread desta conversa.');
  }

  const { error } = await supabase.from('opportunity_chat_messages').insert({
    body: trimmedBody,
    sender_id: userId,
    thread_id: thread.id,
  });

  if (error) {
    throw error;
  }

  reportTelemetryEvent({
    accountId: userId,
    applicationId,
    context: {
      messageLength: trimmedBody.length,
      threadId: thread.id,
    },
    eventName: 'chat_message_sent',
    pathname: '/chat',
  });

  notifyMarketplacePushEvent({
    applicationId,
    eventType: 'chat_message_received',
  });
}

function formatApplicationStatusLabel(
  status: string,
  source: 'marketplace_apply' | 'direct_invite',
) {
  switch (status) {
    case 'accepted':
      return source === 'direct_invite' ? 'Convite aceito' : 'Candidatura aceita';
    case 'declined':
      return 'Convite recusado';
    case 'invited':
      return 'Convite enviado';
    case 'submitted':
      return 'Candidatura enviada';
    case 'shortlisted':
      return 'Musico em destaque';
    case 'rejected':
      return source === 'direct_invite' ? 'Convite encerrado' : 'Candidatura recusada';
    case 'withdrawn':
      return 'Candidatura retirada';
    default:
      return source === 'direct_invite' ? 'Convite em andamento' : 'Candidatura em andamento';
  }
}

function buildContractContextLabel(status: 'cancelled' | 'completed' | 'confirmed' | 'pending_confirmation') {
  return `Contratacao ${formatContractStatusLabel(status).toLowerCase()}`;
}

function formatChatOpportunityScheduleLabel(opportunity: ChatOpportunityRow) {
  const timeLabel = opportunity.start_time.slice(0, 5);
  const durationLabel = `${opportunity.duration_hours} h`;

  if ((opportunity.recurrence_days ?? []).length > 0) {
    return `Toda ${formatRecurrenceDaysLabel(opportunity.recurrence_days)} - ${timeLabel} - ${durationLabel}`;
  }

  return `${formatDateLabel(opportunity.event_date, opportunity.start_time)} - ${durationLabel}`;
}

function formatRecurrenceDaysLabel(values: readonly string[]) {
  const lookup = new Map([
    ['mon', 'Seg'],
    ['tue', 'Ter'],
    ['wed', 'Qua'],
    ['thu', 'Qui'],
    ['fri', 'Sex'],
    ['sat', 'Sab'],
    ['sun', 'Dom'],
  ]);

  const labels = values.map((value) => lookup.get(value) ?? value);

  if (labels.length <= 1) {
    return labels[0] ?? '';
  }

  if (labels.length === 2) {
    return `${labels[0]} e ${labels[1]}`;
  }

  return `${labels.slice(0, -1).join(', ')} e ${labels[labels.length - 1]}`;
}

function formatDateLabel(eventDate: string, startTime: string) {
  const [year, month, day] = eventDate.split('-').map(Number);
  const [hour, minute] = startTime.split(':').map(Number);
  const date = new Date(year, (month ?? 1) - 1, day ?? 1, hour ?? 0, minute ?? 0, 0, 0);

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  }).format(date);
}

export function formatDateTimeLabel(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  }).format(new Date(value));
}

export function formatInboxTimestamp(value: string) {
  const date = new Date(value);
  const now = new Date();
  const sameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (sameDay) {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  }).format(date);
}

export function useChatInbox(accountType: AccountType | null) {
  return useQuery({
    enabled: Boolean(accountType),
    queryFn: () => fetchChatInbox(accountType as AccountType),
    queryKey: ['chat', 'inbox', accountType ?? 'unknown'],
    refetchInterval: 5000,
  });
}

export function useChatThread(applicationId?: string, accountType?: AccountType | null) {
  return useQuery({
    enabled: Boolean(applicationId && accountType),
    queryFn: () =>
      fetchChatThreadDetail({
        accountType: accountType as AccountType,
        applicationId: applicationId as string,
      }),
    queryKey: ['chat', 'thread', accountType ?? 'unknown', applicationId ?? 'missing'],
    refetchInterval: 3000,
  });
}

export function useSendChatMessage(applicationId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['chat', 'thread', applicationId ?? 'missing', 'send'],
    mutationFn: async (body: string) => {
      if (!applicationId) {
        throw new Error('Conversa nao identificada.');
      }

      await sendChatMessage({ applicationId, body });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['chat', 'inbox'] }),
        queryClient.invalidateQueries({ queryKey: ['chat', 'thread'] }),
      ]);
    },
  });
}
