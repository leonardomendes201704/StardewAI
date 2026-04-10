import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { notifyMarketplacePushEvent } from '@/src/features/notifications/notifications';
import { reportTelemetryError, reportTelemetryEvent } from '@/src/features/observability/telemetry';
import { attemptReleaseMusicianPayout } from '@/src/features/payments/payments';
import { type AccountType } from '@/src/features/session/account';
import { supabase } from '@/src/shared/api/supabase/client';

export type ContractStatus = 'pending_confirmation' | 'confirmed' | 'completed' | 'cancelled';

type ContractRow = {
  application_id: string;
  artist_id: string;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  completed_at: string | null;
  confirmed_at: string | null;
  created_at: string;
  id: string;
  last_reschedule_reason: string | null;
  last_rescheduled_at: string | null;
  last_rescheduled_by: string | null;
  opportunity_id: string;
  status: ContractStatus;
  updated_at: string;
  venue_id: string;
};

type ContractOpportunityRow = {
  artist_category: string | null;
  city: string;
  duration_hours: number;
  event_date: string;
  id: string;
  location_label: string;
  recurrence_days: string[];
  start_time: string;
  state: string;
  title: string;
};

type VenueProfileAgendaRow = {
  account_id: string;
  city: string | null;
  cover_image_url: string | null;
  state: string | null;
  venue_name: string | null;
};

type ArtistProfileAgendaRow = {
  account_id: string;
  city: string | null;
  stage_name: string | null;
  state: string | null;
};

type ArtistMediaAgendaRow = {
  artist_id: string;
  created_at: string;
  public_url: string;
  sort_order: number;
};

type ContractScheduleChangeRow = {
  changed_by: string;
  contract_id: string;
  created_at: string;
  id: string;
  new_duration_hours: number;
  new_event_date: string;
  new_location_label: string;
  new_start_time: string;
  opportunity_id: string;
  previous_duration_hours: number;
  previous_event_date: string;
  previous_location_label: string;
  previous_start_time: string;
  reason: string;
};

export type ContractRecord = ContractRow;
export type ContractAgendaOpportunity = ContractOpportunityRow;
export type ContractScheduleChangeRecord = ContractScheduleChangeRow;

export type ContractAgendaItem = {
  applicationId: string;
  contract: ContractRecord;
  counterpartImageUrl: string | null;
  counterpartMeta: string | null;
  counterpartName: string;
  opportunity: ContractOpportunityRow;
};

export type ContractAvailabilityDay = {
  dayNumber: string;
  isBlocked: boolean;
  key: string;
  labels: string[];
  monthLabel: string;
  weekdayLabel: string;
};

export type ContractOperationalReminderKind =
  | 'pending_confirmation'
  | 'upcoming_week'
  | 'upcoming_48h'
  | 'today';

export type ContractOperationalReminder = {
  applicationId: string;
  checklist: string[];
  contractId: string;
  contractStatus: ContractStatus;
  counterpartMeta: string | null;
  counterpartName: string;
  dueLabel: string;
  kind: ContractOperationalReminderKind;
  opportunityId: string;
  opportunityTitle: string;
  scheduleLabel: string;
  title: string;
};

export type CancelOpportunityContractInput = {
  contractId: string;
  reason: string;
};

export type RescheduleOpportunityContractInput = {
  contractId: string;
  durationHours: string;
  eventDate: string;
  locationLabel: string;
  reason: string;
  startTime: string;
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
    throw new Error('Sessao expirada. Entre novamente para seguir com a contratacao.');
  }

  return user.id;
}

export async function fetchContractsByApplicationIds(applicationIds: string[]) {
  if (applicationIds.length === 0) {
    return new Map<string, ContractRecord>();
  }

  const { data, error } = await supabase
    .from('contracts')
    .select(
      'id, application_id, opportunity_id, venue_id, artist_id, status, confirmed_at, completed_at, cancelled_at, cancellation_reason, cancelled_by, last_rescheduled_at, last_rescheduled_by, last_reschedule_reason, created_at, updated_at',
    )
    .in('application_id', applicationIds);

  if (error) {
    throw error;
  }

  return new Map(
    ((data ?? []) as ContractRow[]).map((row) => [row.application_id, row as ContractRecord]),
  );
}

export async function fetchActiveContractsByOpportunityIds(opportunityIds: string[]) {
  if (opportunityIds.length === 0) {
    return new Map<string, ContractRecord>();
  }

  const { data, error } = await supabase
    .from('contracts')
    .select(
      'id, application_id, opportunity_id, venue_id, artist_id, status, confirmed_at, completed_at, cancelled_at, cancellation_reason, cancelled_by, last_rescheduled_at, last_rescheduled_by, last_reschedule_reason, created_at, updated_at',
    )
    .in('opportunity_id', opportunityIds)
    .in('status', ['pending_confirmation', 'confirmed', 'completed'])
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  const contractMap = new Map<string, ContractRecord>();

  for (const row of (data ?? []) as ContractRow[]) {
    if (!contractMap.has(row.opportunity_id)) {
      contractMap.set(row.opportunity_id, row as ContractRecord);
    }
  }

  return contractMap;
}

async function selectOpportunityCandidateForContract(applicationId: string) {
  const { error } = await supabase.rpc('select_opportunity_candidate_for_contract', {
    target_application_id: applicationId,
  });

  if (error) {
    throw error;
  }

  reportTelemetryEvent({
    applicationId,
    eventName: 'candidate_selected_for_contract',
    pathname: '/bar/home',
  });
}

async function confirmOpportunityContract(contractId: string) {
  const { error } = await supabase.rpc('confirm_opportunity_contract', {
    target_contract_id: contractId,
  });

  if (error) {
    throw error;
  }

  reportTelemetryEvent({
    contractId,
    eventName: 'contract_confirmed',
  });

  notifyMarketplacePushEvent({
    contractId,
    eventType: 'contract_confirmed',
  });
}

async function completeOpportunityContract(contractId: string) {
  const { error } = await supabase.rpc('complete_opportunity_contract', {
    target_contract_id: contractId,
  });

  if (error) {
    throw error;
  }

  reportTelemetryEvent({
    contractId,
    eventName: 'contract_completed',
  });

  try {
    await attemptReleaseMusicianPayout(contractId);
  } catch (payoutError) {
    reportTelemetryError({
      context: {
        contractId,
      },
      error: payoutError,
      source: 'contract_complete_release_payout',
    });
  }
}

async function cancelOpportunityContract(input: CancelOpportunityContractInput) {
  const normalizedReason = sanitizeContractReason(input.reason);

  if (!normalizedReason || normalizedReason.length < 8) {
    throw new Error('Descreva um motivo com pelo menos 8 caracteres para cancelar.');
  }

  const { error } = await supabase.rpc('cancel_opportunity_contract_with_reason', {
    target_contract_id: input.contractId,
    target_reason: normalizedReason,
  });

  if (error) {
    throw normalizeContractMutationError(error, 'Nao foi possivel cancelar esta contratacao.');
  }

  reportTelemetryEvent({
    context: {
      reasonLength: normalizedReason.length,
    },
    contractId: input.contractId,
    eventName: 'contract_cancelled',
  });
}

async function declineDirectOpportunityInvite(contractId: string) {
  const { error } = await supabase.rpc('decline_direct_opportunity_invite', {
    target_contract_id: contractId,
  });

  if (error) {
    throw error;
  }

  reportTelemetryEvent({
    contractId,
    eventName: 'direct_invite_declined',
  });
}

async function cancelDirectOpportunityInvite(contractId: string) {
  const { error } = await supabase.rpc('cancel_direct_opportunity_invite', {
    target_contract_id: contractId,
  });

  if (error) {
    throw error;
  }

  reportTelemetryEvent({
    contractId,
    eventName: 'direct_invite_cancelled',
  });
}

async function rescheduleOpportunityContract(input: RescheduleOpportunityContractInput) {
  const normalizedDate = sanitizeDatabaseDate(input.eventDate);
  const normalizedTime = sanitizeDatabaseTime(input.startTime);
  const normalizedLocationLabel = sanitizeContractLocationLabel(input.locationLabel);
  const normalizedReason = sanitizeContractReason(input.reason);
  const normalizedDurationHours = parseContractDurationHours(input.durationHours);

  if (!normalizedDate || !normalizedTime) {
    throw new Error('Informe uma nova data e um novo horario validos para a remarcacao.');
  }

  if (!normalizedLocationLabel || normalizedLocationLabel.length < 2) {
    throw new Error('Informe uma referencia valida de local para a remarcacao.');
  }

  if (!normalizedReason || normalizedReason.length < 8) {
    throw new Error('Descreva um motivo com pelo menos 8 caracteres para remarcacao.');
  }

  if (normalizedDurationHours === null || normalizedDurationHours <= 0 || normalizedDurationHours > 12) {
    throw new Error('Informe uma duracao valida em horas para a remarcacao.');
  }

  const { error } = await supabase.rpc('reschedule_opportunity_contract', {
    target_contract_id: input.contractId,
    target_duration_hours: normalizedDurationHours,
    target_event_date: normalizedDate,
    target_location_label: normalizedLocationLabel,
    target_reason: normalizedReason,
    target_start_time: normalizedTime,
  });

  if (error) {
    throw normalizeContractMutationError(error, 'Nao foi possivel remarcar esta contratacao.');
  }

  reportTelemetryEvent({
    context: {
      durationHours: normalizedDurationHours,
      eventDate: normalizedDate,
      startTime: normalizedTime,
    },
    contractId: input.contractId,
    eventName: 'contract_rescheduled',
  });
}

async function fetchContractAgenda(accountType: AccountType): Promise<ContractAgendaItem[]> {
  const userId = await requireAuthenticatedUserId();
  const roleColumn = accountType === 'bar' ? 'venue_id' : 'artist_id';

  const { data, error } = await supabase
    .from('contracts')
    .select(
      'id, application_id, opportunity_id, venue_id, artist_id, status, confirmed_at, completed_at, cancelled_at, cancellation_reason, cancelled_by, last_rescheduled_at, last_rescheduled_by, last_reschedule_reason, created_at, updated_at',
    )
    .eq(roleColumn, userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  const contracts = (data ?? []) as ContractRow[];

  if (contracts.length === 0) {
    return [];
  }

  const opportunityIds = Array.from(new Set(contracts.map((item) => item.opportunity_id)));
  const counterpartIds = Array.from(
    new Set(contracts.map((item) => (accountType === 'bar' ? item.artist_id : item.venue_id))),
  );

  const [opportunityMap, counterpartMap] = await Promise.all([
    fetchAgendaOpportunitiesByIds(opportunityIds),
    fetchAgendaCounterpartMap(accountType, counterpartIds),
  ]);

  return contracts
    .map((contract) => {
      const opportunity = opportunityMap.get(contract.opportunity_id);

      if (!opportunity) {
        return null;
      }

      const counterpartId = accountType === 'bar' ? contract.artist_id : contract.venue_id;
      const counterpart = counterpartMap.get(counterpartId);

      return {
        applicationId: contract.application_id,
        contract: contract as ContractRecord,
        counterpartImageUrl: counterpart?.imageUrl ?? null,
        counterpartMeta: counterpart?.meta ?? null,
        counterpartName:
          counterpart?.name ??
          (accountType === 'bar' ? 'Musico sem identificacao' : 'Bar sem identificacao'),
        opportunity,
      } satisfies ContractAgendaItem;
    })
    .filter((item): item is ContractAgendaItem => Boolean(item))
    .sort(compareContractAgendaItems);
}

async function fetchContractScheduleChanges(contractId: string) {
  const { data, error } = await supabase
    .from('contract_schedule_changes')
    .select(
      'id, contract_id, opportunity_id, changed_by, reason, previous_event_date, previous_start_time, previous_duration_hours, previous_location_label, new_event_date, new_start_time, new_duration_hours, new_location_label, created_at',
    )
    .eq('contract_id', contractId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as ContractScheduleChangeRecord[];
}

async function fetchAgendaOpportunitiesByIds(opportunityIds: string[]) {
  const { data, error } = await supabase
    .from('opportunities')
    .select(
      'id, title, event_date, start_time, duration_hours, recurrence_days, city, state, location_label, artist_category',
    )
    .in('id', opportunityIds);

  if (error) {
    throw error;
  }

  return new Map((data ?? []).map((row) => [row.id, row as ContractOpportunityRow]));
}

async function fetchAgendaCounterpartMap(accountType: AccountType, counterpartIds: string[]) {
  if (counterpartIds.length === 0) {
    return new Map<
      string,
      {
        imageUrl: string | null;
        meta: string | null;
        name: string;
      }
    >();
  }

  if (accountType === 'musician') {
    const { data, error } = await supabase
      .from('venue_profiles')
      .select('account_id, venue_name, cover_image_url, city, state')
      .in('account_id', counterpartIds);

    if (error) {
      throw error;
    }

    return new Map(
      ((data ?? []) as VenueProfileAgendaRow[]).map((row) => [
        row.account_id,
        {
          imageUrl: row.cover_image_url ?? null,
          meta: [row.city, row.state].filter(Boolean).join('/') || null,
          name: row.venue_name?.trim() || 'Bar sem nome',
        },
      ]),
    );
  }

  const [{ data: artists, error: artistError }, { data: media, error: mediaError }] =
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

  if (artistError) {
    throw artistError;
  }

  if (mediaError) {
    throw mediaError;
  }

  const mediaMap = new Map<string, string>();

  for (const row of (media ?? []) as ArtistMediaAgendaRow[]) {
    if (!mediaMap.has(row.artist_id)) {
      mediaMap.set(row.artist_id, row.public_url);
    }
  }

  return new Map(
    ((artists ?? []) as ArtistProfileAgendaRow[]).map((row) => [
      row.account_id,
      {
        imageUrl: mediaMap.get(row.account_id) ?? null,
        meta: [row.city, row.state].filter(Boolean).join('/') || null,
        name: row.stage_name?.trim() || 'Musico sem nome',
      },
    ]),
  );
}

function buildAgendaDate(eventDate: string, startTime: string) {
  const [year, month, day] = eventDate.split('-').map(Number);
  const [hour, minute] = startTime.split(':').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1, hour ?? 0, minute ?? 0, 0, 0);
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function formatCalendarKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function jsDayToWeekdayKey(day: number) {
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

function getNextOpportunityOccurrence(opportunity: ContractAgendaOpportunity, referenceDate = new Date()) {
  const seriesStartDate = buildAgendaDate(opportunity.event_date, opportunity.start_time);

  if ((opportunity.recurrence_days ?? []).length === 0) {
    return seriesStartDate;
  }

  const baseDate =
    seriesStartDate.getTime() > referenceDate.getTime()
      ? new Date(seriesStartDate)
      : new Date(referenceDate);
  const [hour, minute] = opportunity.start_time.split(':').map(Number);

  for (let offset = 0; offset <= 7; offset += 1) {
    const candidate = new Date(baseDate);
    candidate.setHours(0, 0, 0, 0);
    candidate.setDate(candidate.getDate() + offset);

    const candidateKey = jsDayToWeekdayKey(candidate.getDay());

    if (!(opportunity.recurrence_days ?? []).includes(candidateKey)) {
      continue;
    }

    candidate.setHours(hour ?? 0, minute ?? 0, 0, 0);

    if (candidate.getTime() >= referenceDate.getTime()) {
      return candidate;
    }
  }

  return seriesStartDate;
}

function getOpportunityOccurrencesInWindow(
  opportunity: ContractAgendaOpportunity,
  windowStart: Date,
  days: number,
) {
  const occurrences: Date[] = [];
  const endDate = new Date(windowStart);
  endDate.setDate(endDate.getDate() + days - 1);
  endDate.setHours(23, 59, 59, 999);
  const seriesStartDate = buildAgendaDate(opportunity.event_date, opportunity.start_time);
  const [hour, minute] = opportunity.start_time.split(':').map(Number);

  if ((opportunity.recurrence_days ?? []).length === 0) {
    if (
      seriesStartDate.getTime() >= windowStart.getTime() &&
      seriesStartDate.getTime() <= endDate.getTime()
    ) {
      occurrences.push(seriesStartDate);
    }

    return occurrences;
  }

  for (let offset = 0; offset < days; offset += 1) {
    const candidate = new Date(windowStart);
    candidate.setDate(candidate.getDate() + offset);
    candidate.setHours(hour ?? 0, minute ?? 0, 0, 0);

    if (candidate.getTime() < seriesStartDate.getTime()) {
      continue;
    }

    if (!(opportunity.recurrence_days ?? []).includes(jsDayToWeekdayKey(candidate.getDay()))) {
      continue;
    }

    occurrences.push(candidate);
  }

  return occurrences;
}

function getContractHistoryTimestamp(item: ContractAgendaItem) {
  if (item.contract.completed_at) {
    return new Date(item.contract.completed_at).getTime();
  }

  if (item.contract.cancelled_at) {
    return new Date(item.contract.cancelled_at).getTime();
  }

  return getNextOpportunityOccurrence(item.opportunity).getTime();
}

export function canContractBeCancelled(status: ContractStatus) {
  return status === 'pending_confirmation' || status === 'confirmed';
}

export function canContractBeCompleted(status: ContractStatus) {
  return status === 'confirmed';
}

export function isContractHistoryItem(item: ContractAgendaItem, referenceDate = new Date()) {
  if (item.contract.status === 'completed' || item.contract.status === 'cancelled') {
    return true;
  }

  const today = startOfDay(referenceDate);
  return getNextOpportunityOccurrence(item.opportunity, referenceDate).getTime() < today.getTime();
}

export function compareContractAgendaItems(
  left: ContractAgendaItem,
  right: ContractAgendaItem,
  referenceDate = new Date(),
) {
  const leftIsHistory = isContractHistoryItem(left, referenceDate);
  const rightIsHistory = isContractHistoryItem(right, referenceDate);

  if (leftIsHistory !== rightIsHistory) {
    return leftIsHistory ? 1 : -1;
  }

  if (leftIsHistory && rightIsHistory) {
    return getContractHistoryTimestamp(right) - getContractHistoryTimestamp(left);
  }

  const leftDate = getNextOpportunityOccurrence(left.opportunity, referenceDate).getTime();
  const rightDate = getNextOpportunityOccurrence(right.opportunity, referenceDate).getTime();

  if (leftDate !== rightDate) {
    return leftDate - rightDate;
  }

  return left.opportunity.title.localeCompare(right.opportunity.title);
}

export function buildMusicianAvailabilityWindow(
  items: ContractAgendaItem[],
  days = 21,
  referenceDate = new Date(),
): ContractAvailabilityDay[] {
  const windowStart = startOfDay(referenceDate);
  const blockedMap = new Map<string, Set<string>>();

  for (const item of items) {
    if (!canContractBeCancelled(item.contract.status)) {
      continue;
    }

    const occurrences = getOpportunityOccurrencesInWindow(item.opportunity, windowStart, days);

    for (const occurrence of occurrences) {
      const key = formatCalendarKey(occurrence);
      const entry = blockedMap.get(key) ?? new Set<string>();
      entry.add(`${item.counterpartName} - ${item.opportunity.title}`);
      blockedMap.set(key, entry);
    }
  }

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(windowStart);
    date.setDate(windowStart.getDate() + index);
    const key = formatCalendarKey(date);
    const labels = Array.from(blockedMap.get(key) ?? []);

    return {
      dayNumber: `${date.getDate()}`.padStart(2, '0'),
      isBlocked: labels.length > 0,
      key,
      labels,
      monthLabel: new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(date),
      weekdayLabel: new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(date),
    } satisfies ContractAvailabilityDay;
  });
}

export function buildContractOperationalReminders(
  items: ContractAgendaItem[],
  accountType: AccountType,
  referenceDate = new Date(),
) {
  return items
    .filter((item) => !isContractHistoryItem(item, referenceDate))
    .map((item) => {
      const nextOccurrence = getNextOpportunityOccurrence(item.opportunity, referenceDate);
      const hoursUntil = (nextOccurrence.getTime() - referenceDate.getTime()) / (1000 * 60 * 60);
      const kind = getContractOperationalReminderKind(item.contract.status, hoursUntil);

      if (!kind) {
        return null;
      }

      return {
        applicationId: item.applicationId,
        checklist: buildContractOperationalReminderChecklist(accountType, kind),
        contractId: item.contract.id,
        contractStatus: item.contract.status,
        counterpartMeta: item.counterpartMeta,
        counterpartName: item.counterpartName,
        dueLabel: formatContractOperationalReminderDueLabel(kind),
        kind,
        opportunityId: item.opportunity.id,
        opportunityTitle: item.opportunity.title,
        scheduleLabel: formatContractAgendaScheduleLabel(item.opportunity),
        title: buildContractOperationalReminderTitle(accountType, kind),
      } satisfies ContractOperationalReminder;
    })
    .filter((item): item is ContractOperationalReminder => Boolean(item))
    .sort(compareContractOperationalReminders);
}

export function formatContractAgendaScheduleLabel(opportunity: ContractAgendaOpportunity) {
  const timeLabel = opportunity.start_time.slice(0, 5);
  const durationLabel = `${opportunity.duration_hours} h`;

  if ((opportunity.recurrence_days ?? []).length > 0) {
    return `Toda ${formatRecurrenceDaysLabel(opportunity.recurrence_days)} - ${timeLabel} - ${durationLabel}`;
  }

  return `${formatAgendaDateLabel(opportunity.event_date, opportunity.start_time)} - ${durationLabel}`;
}

export function formatContractStatusLabel(status: ContractStatus) {
  switch (status) {
    case 'confirmed':
      return 'Show confirmado';
    case 'completed':
      return 'Show concluido';
    case 'cancelled':
      return 'Contratacao cancelada';
    case 'pending_confirmation':
    default:
      return 'Aguardando confirmacao';
  }
}

export function getContractTone(status: ContractStatus): 'primary' | 'secondary' | 'muted' {
  if (status === 'confirmed' || status === 'completed') {
    return 'primary';
  }

  if (status === 'pending_confirmation') {
    return 'secondary';
  }

  return 'muted';
}

export function formatContractMutationDateLabel(eventDate: string, startTime: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(buildAgendaDate(eventDate, startTime));
}

export function formatContractScheduleChangeLabel(change: ContractScheduleChangeRecord) {
  return `${formatContractMutationDateLabel(change.new_event_date, change.new_start_time)} - ${change.new_duration_hours} h`;
}

export function formatContractScheduleChangePreviousLabel(change: ContractScheduleChangeRecord) {
  return `${formatContractMutationDateLabel(change.previous_event_date, change.previous_start_time)} - ${change.previous_duration_hours} h`;
}

export function formatContractReasonLabel(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
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

function formatAgendaDateLabel(eventDate: string, startTime: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  }).format(buildAgendaDate(eventDate, startTime));
}

function getContractOperationalReminderKind(
  status: ContractStatus,
  hoursUntil: number,
): ContractOperationalReminderKind | null {
  if (status === 'pending_confirmation') {
    return 'pending_confirmation';
  }

  if (status !== 'confirmed') {
    return null;
  }

  if (hoursUntil <= 24) {
    return 'today';
  }

  if (hoursUntil <= 48) {
    return 'upcoming_48h';
  }

  if (hoursUntil <= 24 * 7) {
    return 'upcoming_week';
  }

  return null;
}

function buildContractOperationalReminderTitle(
  accountType: AccountType,
  kind: ContractOperationalReminderKind,
) {
  switch (kind) {
    case 'pending_confirmation':
      return accountType === 'bar'
        ? 'Confirmacao pendente'
        : 'Voce ainda precisa confirmar este show';
    case 'today':
      return 'Show de hoje';
    case 'upcoming_48h':
      return 'Show nas proximas 48h';
    case 'upcoming_week':
    default:
      return 'Show desta semana';
  }
}

function formatContractOperationalReminderDueLabel(kind: ContractOperationalReminderKind) {
  switch (kind) {
    case 'pending_confirmation':
      return 'Aguardando resposta';
    case 'today':
      return 'Hoje';
    case 'upcoming_48h':
      return 'Ate 48h';
    case 'upcoming_week':
    default:
      return 'Nesta semana';
  }
}

function buildContractOperationalReminderChecklist(
  accountType: AccountType,
  kind: ContractOperationalReminderKind,
) {
  if (kind === 'pending_confirmation') {
    if (accountType === 'bar') {
      return [
        'Confirme a resposta oficial do artista no app.',
        'Feche horario, formato e operacao pelo chat.',
        'Revise cache, local e condicoes da vaga antes do fechamento.',
      ];
    }

    return [
      'Revise cache, data e local antes de aceitar.',
      'Alinhe repertorio, chegada e detalhes da casa no chat.',
      'Confirme o show no app para travar a agenda com seguranca.',
    ];
  }

  if (accountType === 'bar') {
    return [
      'Confirme horario de chegada e passagem de som.',
      'Revise contato responsavel, estrutura e local do evento.',
      'Garanta que o chat esteja atualizado com qualquer ajuste final.',
    ];
  }

  return [
    'Confirme deslocamento, horario de chegada e repertorio.',
    'Revise contato da casa, estrutura e observacoes operacionais.',
    'Use o chat para registrar qualquer ajuste antes do show.',
  ];
}

function getContractOperationalReminderPriority(kind: ContractOperationalReminderKind) {
  switch (kind) {
    case 'pending_confirmation':
      return 0;
    case 'today':
      return 1;
    case 'upcoming_48h':
      return 2;
    case 'upcoming_week':
    default:
      return 3;
  }
}

function compareContractOperationalReminders(
  left: ContractOperationalReminder,
  right: ContractOperationalReminder,
) {
  const priorityDelta =
    getContractOperationalReminderPriority(left.kind) -
    getContractOperationalReminderPriority(right.kind);

  if (priorityDelta !== 0) {
    return priorityDelta;
  }

  const leftStatus = left.contractStatus === 'pending_confirmation' ? 0 : 1;
  const rightStatus = right.contractStatus === 'pending_confirmation' ? 0 : 1;

  if (leftStatus !== rightStatus) {
    return leftStatus - rightStatus;
  }

  return left.opportunityTitle.localeCompare(right.opportunityTitle);
}

export function useSelectOpportunityCandidateForContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['contracts', 'select-candidate'],
    mutationFn: selectOpportunityCandidateForContract,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['contracts'] }),
        queryClient.invalidateQueries({ queryKey: ['opportunities'] }),
        queryClient.invalidateQueries({ queryKey: ['chat'] }),
        queryClient.invalidateQueries({ queryKey: ['payments'] }),
      ]);
    },
  });
}

export function useConfirmOpportunityContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['contracts', 'confirm'],
    mutationFn: confirmOpportunityContract,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['contracts'] }),
        queryClient.invalidateQueries({ queryKey: ['opportunities'] }),
        queryClient.invalidateQueries({ queryKey: ['chat'] }),
      ]);
    },
  });
}

export function useCompleteOpportunityContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['contracts', 'complete'],
    mutationFn: completeOpportunityContract,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['contracts'] }),
        queryClient.invalidateQueries({ queryKey: ['opportunities'] }),
        queryClient.invalidateQueries({ queryKey: ['chat'] }),
      ]);
    },
  });
}

export function useCancelOpportunityContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['contracts', 'cancel'],
    mutationFn: cancelOpportunityContract,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['contracts'] }),
        queryClient.invalidateQueries({ queryKey: ['contracts', 'schedule-changes'] }),
        queryClient.invalidateQueries({ queryKey: ['opportunities'] }),
        queryClient.invalidateQueries({ queryKey: ['chat'] }),
      ]);
    },
  });
}

export function useRescheduleOpportunityContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['contracts', 'reschedule'],
    mutationFn: rescheduleOpportunityContract,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['contracts'] }),
        queryClient.invalidateQueries({ queryKey: ['contracts', 'schedule-changes'] }),
        queryClient.invalidateQueries({ queryKey: ['opportunities'] }),
        queryClient.invalidateQueries({ queryKey: ['chat'] }),
      ]);
    },
  });
}

export function useDeclineDirectOpportunityInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['contracts', 'decline-invite'],
    mutationFn: declineDirectOpportunityInvite,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['contracts'] }),
        queryClient.invalidateQueries({ queryKey: ['opportunities'] }),
        queryClient.invalidateQueries({ queryKey: ['chat'] }),
      ]);
    },
  });
}

export function useCancelDirectOpportunityInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['contracts', 'cancel-invite'],
    mutationFn: cancelDirectOpportunityInvite,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['contracts'] }),
        queryClient.invalidateQueries({ queryKey: ['contracts', 'schedule-changes'] }),
        queryClient.invalidateQueries({ queryKey: ['opportunities'] }),
        queryClient.invalidateQueries({ queryKey: ['chat'] }),
      ]);
    },
  });
}

export function useContractAgenda(accountType?: AccountType | null) {
  return useQuery({
    enabled: Boolean(accountType),
    queryFn: () => fetchContractAgenda(accountType as AccountType),
    queryKey: ['contracts', 'agenda', accountType ?? 'unknown'],
  });
}

export function useContractScheduleChanges(contractId?: string) {
  return useQuery({
    enabled: Boolean(contractId),
    queryFn: () => fetchContractScheduleChanges(contractId!),
    queryKey: ['contracts', 'schedule-changes', contractId ?? 'missing'],
  });
}

function sanitizeContractReason(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function sanitizeContractLocationLabel(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function parseContractDurationHours(value: string | null | undefined) {
  const normalized = value?.trim();

  if (!normalized) {
    return null;
  }

  const parsed = Number.parseInt(normalized, 10);

  if (Number.isNaN(parsed)) {
    return null;
  }

  return parsed;
}

function sanitizeDatabaseDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (!match) {
    return null;
  }

  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

function sanitizeDatabaseTime(value: string | null | undefined) {
  const normalized = value?.trim();

  if (!normalized) {
    return null;
  }

  if (/^\d{2}:\d{2}:\d{2}$/.test(normalized)) {
    return normalized;
  }

  if (!/^\d{2}:\d{2}$/.test(normalized)) {
    return null;
  }

  return `${normalized}:00`;
}

function normalizeContractMutationError(error: unknown, fallbackMessage: string) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string' &&
    error.message.trim()
  ) {
    return new Error(error.message);
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error(fallbackMessage);
}
