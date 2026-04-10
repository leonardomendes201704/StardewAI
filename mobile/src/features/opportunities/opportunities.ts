import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { notifyMarketplacePushEvent } from '@/src/features/notifications/notifications';
import {
  type ContractRecord,
  type ContractStatus,
  fetchContractsByApplicationIds,
} from '@/src/features/contracts/contracts';
import { reportTelemetryEvent } from '@/src/features/observability/telemetry';
import { type ProfileMediaAsset } from '@/src/features/profiles/profile-media';
import { supabase } from '@/src/shared/api/supabase/client';
import {
  calculateDistanceKm,
  resolvePostalCodeCoordinates,
  resolvePostalCodeCoordinatesBatch,
} from '@/src/shared/lib/geolocation';

export type OpportunityStatus = 'draft' | 'open' | 'closed' | 'cancelled';
export type OpportunityApplicationStatus =
  | 'invited'
  | 'submitted'
  | 'shortlisted'
  | 'declined'
  | 'rejected'
  | 'accepted'
  | 'withdrawn';
export type OpportunityApplicationSource = 'marketplace_apply' | 'direct_invite';
export type WeekdayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export const WEEKDAY_OPTIONS: Array<{ key: WeekdayKey; label: string; longLabel: string }> = [
  { key: 'mon', label: 'Seg', longLabel: 'Segunda' },
  { key: 'tue', label: 'Ter', longLabel: 'Terca' },
  { key: 'wed', label: 'Qua', longLabel: 'Quarta' },
  { key: 'thu', label: 'Qui', longLabel: 'Quinta' },
  { key: 'fri', label: 'Sex', longLabel: 'Sexta' },
  { key: 'sat', label: 'Sab', longLabel: 'Sabado' },
  { key: 'sun', label: 'Dom', longLabel: 'Domingo' },
];

type VenueProfileSummaryRow = {
  account_id: string;
  address_text: string | null;
  city: string | null;
  cover_image_url: string | null;
  postal_code: string | null;
  state: string | null;
  venue_name: string | null;
  venue_type: string | null;
};

type ArtistProfileSummaryRow = {
  city: string | null;
  performance_radius_km: number | null;
  postal_code: string | null;
  state: string | null;
};

type OpportunityRow = {
  artist_category: string | null;
  budget_cents: number;
  city: string;
  created_at: string;
  duration_hours: number;
  event_date: string;
  id: string;
  is_urgent: boolean;
  location_label: string;
  music_genres: string[];
  notes: string | null;
  recurrence_days: WeekdayKey[];
  start_time: string;
  state: string;
  status: OpportunityStatus;
  structure_summary: string | null;
  title: string;
  updated_at: string;
  venue_id: string;
};

type OpportunityApplicationRow = {
  artist_id: string;
  created_at: string;
  id: string;
  opportunity_id: string;
  source: OpportunityApplicationSource;
  status: OpportunityApplicationStatus;
  updated_at: string;
};

type ProfileMediaAssetRow = {
  created_at: string;
  file_size_bytes: number | null;
  height: number | null;
  id: string;
  mime_type: string | null;
  public_url: string;
  sort_order: number;
  storage_path: string;
  width: number | null;
};

type VenueReviewRow = {
  author_artist_id: string | null;
  comment: string;
  created_at: string;
  id: string;
  opportunity_id: string | null;
  rating: number;
  reviewer_city: string | null;
  reviewer_name: string;
  venue_id: string;
};

export type VenueProfileSummary = VenueProfileSummaryRow;

export type OpportunityRecord = OpportunityRow;
export type OpportunityApplicationRecord = OpportunityApplicationRow;
export type VenueReviewRecord = VenueReviewRow;

export type OpportunityFeedItem = OpportunityRecord & {
  applicationId: string | null;
  applicationCreatedAt: string | null;
  applicationSource: OpportunityApplicationSource | null;
  applicationStatus: OpportunityApplicationStatus | null;
  contractConfirmedAt: string | null;
  contractId: string | null;
  contractStatus: ContractStatus | null;
  distanceKm: number | null;
  isWithinTravelRadius: boolean | null;
  venueCoverImageUrl: string | null;
  venueName: string;
  venueType: string | null;
};

export type BarOpportunityDashboardData = {
  opportunities: OpportunityRecord[];
  venueProfile: VenueProfileSummary | null;
};

export type MusicianOpportunityFeedData = {
  artistCity: string | null;
  artistRadiusKm: number | null;
  artistState: string | null;
  opportunities: OpportunityFeedItem[];
};

export type OpportunityLocationMatchScope = 'city' | 'national' | 'state';

export type MusicianOpportunityDetailData = {
  application: OpportunityApplicationRecord | null;
  contract: ContractRecord | null;
  opportunity: OpportunityFeedItem;
  venueMediaAssets: ProfileMediaAsset[];
  venueRatingAverage: number | null;
  venueRatingCount: number;
  venueProfile: VenueProfileSummary | null;
  venueReviews: VenueReviewRecord[];
};

export type OpportunityEditorData = {
  opportunity: OpportunityRecord | null;
  venueProfile: VenueProfileSummary | null;
};

export type SaveOpportunityInput = {
  artistCategory: string;
  budgetCents: number | null;
  city: string;
  durationHours: number | null;
  eventDate: string;
  isUrgent: boolean;
  locationLabel: string;
  musicGenres: string[];
  notes: string;
  recurrenceDays: WeekdayKey[];
  startTime: string;
  state: string;
  status: OpportunityStatus;
  structureSummary: string;
  title: string;
};

export type CreateDirectOpportunityInviteInput = {
  artistId: string;
  opportunityId: string;
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
    throw new Error('Sessao expirada. Entre novamente para operar vagas.');
  }

  return user.id;
}

async function fetchVenueProfileSummary(userId: string) {
  const { data, error } = await supabase
    .from('venue_profiles')
    .select('account_id, venue_name, venue_type, city, state, address_text, cover_image_url')
    .eq('account_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as VenueProfileSummary | null;
}

async function fetchBarOpportunityDashboard(): Promise<BarOpportunityDashboardData> {
  const userId = await requireAuthenticatedUserId();

  const [{ data: opportunities, error: opportunitiesError }, venueProfile] = await Promise.all([
    supabase
      .from('opportunities')
      .select(
        'id, venue_id, title, event_date, start_time, duration_hours, recurrence_days, music_genres, artist_category, budget_cents, city, state, location_label, structure_summary, notes, is_urgent, status, created_at, updated_at',
      )
      .eq('venue_id', userId)
      .order('event_date', { ascending: true })
      .order('start_time', { ascending: true }),
    fetchVenueProfileSummary(userId),
  ]);

  if (opportunitiesError) {
    throw opportunitiesError;
  }

  return {
    opportunities: mapOpportunityRows(opportunities).sort(compareOpportunitiesAsc),
    venueProfile,
  };
}

async function fetchOpportunityEditor(opportunityId?: string): Promise<OpportunityEditorData> {
  const userId = await requireAuthenticatedUserId();
  const venueProfile = await fetchVenueProfileSummary(userId);

  if (!opportunityId) {
    return {
      opportunity: null,
      venueProfile,
    };
  }

  const { data, error } = await supabase
    .from('opportunities')
    .select(
      'id, venue_id, title, event_date, start_time, duration_hours, recurrence_days, music_genres, artist_category, budget_cents, city, state, location_label, structure_summary, notes, is_urgent, status, created_at, updated_at',
    )
    .eq('venue_id', userId)
    .eq('id', opportunityId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('Nao foi possivel encontrar essa vaga para edicao.');
  }

  return {
    opportunity: mapOpportunityRow(data),
    venueProfile,
  };
}

async function fetchMusicianOpportunityFeed(): Promise<MusicianOpportunityFeedData> {
  const userId = await requireAuthenticatedUserId();

  const { data: artistProfile, error: artistProfileError } = await supabase
    .from('artist_profiles')
    .select('city, state, postal_code, performance_radius_km')
    .eq('account_id', userId)
    .maybeSingle();

  if (artistProfileError) {
    throw artistProfileError;
  }

  const artistSummary = (artistProfile ?? null) as ArtistProfileSummaryRow | null;
  const artistRadiusKm = artistSummary?.performance_radius_km ?? null;
  const today = formatDateForDatabase(new Date());

  const openOpportunities = await fetchOpenOpportunities({
    eventDateFrom: today,
  });
  const allApplications = await fetchOpportunityApplicationsByArtist(userId);
  const contractMap = await fetchContractsByApplicationIds(allApplications.map((item) => item.id));
  const trackedOpportunityIds = allApplications
    .filter((application) => {
      const contract = contractMap.get(application.id);
      return contract?.status === 'pending_confirmation';
    })
    .map((application) => application.opportunity_id);
  const missingTrackedOpportunityIds = trackedOpportunityIds.filter(
    (opportunityId) => !openOpportunities.some((item) => item.id === opportunityId),
  );
  const trackedOpportunities =
    missingTrackedOpportunityIds.length > 0
      ? await fetchOpportunitiesByIds(missingTrackedOpportunityIds)
      : [];
  const mergedOpportunityMap = new Map<string, OpportunityRecord>();

  for (const item of [...openOpportunities, ...trackedOpportunities]) {
    if (isOpportunityVisibleInFeed(item, today)) {
      mergedOpportunityMap.set(item.id, item);
    }
  }

  const opportunities = Array.from(mergedOpportunityMap.values()).sort(compareOpportunitiesAsc);
  const applicationMap = new Map(
    allApplications.map((application) => [application.opportunity_id, application]),
  );

  const venueIds = Array.from(new Set(opportunities.map((item) => item.venue_id)));
  const [venueProfiles] = await Promise.all([
    fetchVenueProfilesByIds(venueIds),
  ]);
  const coordinateMap = await resolvePostalCodeCoordinatesBatch([
    {
      city: artistSummary?.city ?? null,
      key: `artist:${userId}`,
      postalCode: artistSummary?.postal_code ?? null,
      state: artistSummary?.state ?? null,
    },
    ...Array.from(venueProfiles.values()).map((venueProfile) => ({
      city: venueProfile.city,
      key: `venue:${venueProfile.account_id}`,
      postalCode: venueProfile.postal_code,
      state: venueProfile.state,
    })),
  ]);
  const artistCoordinates = coordinateMap.get(`artist:${userId}`) ?? null;

  const feedItems = opportunities
    .map((opportunity) => {
      const venueProfile = venueProfiles.get(opportunity.venue_id);
      const application = applicationMap.get(opportunity.id);
      const contract = application ? contractMap.get(application.id) ?? null : null;
      const venueCoordinates = coordinateMap.get(`venue:${opportunity.venue_id}`) ?? null;
      const distanceKm = calculateDistanceKm(artistCoordinates, venueCoordinates);
      const isWithinTravelRadius =
        distanceKm !== null && artistRadiusKm !== null
          ? distanceKm <= artistRadiusKm
          : null;

      return {
        ...opportunity,
        applicationId: application?.id ?? null,
        applicationCreatedAt: application?.created_at ?? null,
        applicationSource: application?.source ?? null,
        applicationStatus: application?.status ?? null,
        contractConfirmedAt: contract?.confirmed_at ?? null,
        contractId: contract?.id ?? null,
        contractStatus: contract?.status ?? null,
        distanceKm,
        isWithinTravelRadius,
        venueCoverImageUrl: venueProfile?.cover_image_url ?? null,
        venueName: venueProfile?.venue_name?.trim() || 'Espaco sem nome',
        venueType: venueProfile?.venue_type ?? null,
      } satisfies OpportunityFeedItem;
    })
    .filter(shouldIncludeOpportunityFeedItem)
    .sort((left, right) =>
      compareOpportunityFeedItemsByRelevance(
        left,
        right,
        artistSummary?.city ?? null,
        artistSummary?.state ?? null,
      ),
    );

  return {
    artistCity: artistSummary?.city ?? null,
    artistRadiusKm,
    artistState: artistSummary?.state ?? null,
    opportunities: feedItems,
  };
}

async function fetchMusicianOpportunityDetail(
  opportunityId: string,
): Promise<MusicianOpportunityDetailData> {
  const userId = await requireAuthenticatedUserId();
  const [{ data, error }, applicationMap, { data: artistProfile, error: artistProfileError }] = await Promise.all([
    supabase
      .from('opportunities')
      .select(
      'id, venue_id, title, event_date, start_time, duration_hours, recurrence_days, music_genres, artist_category, budget_cents, city, state, location_label, structure_summary, notes, is_urgent, status, created_at, updated_at',
    )
    .eq('id', opportunityId)
    .maybeSingle(),
    fetchOpportunityApplicationsByIds(userId, [opportunityId]),
    supabase
      .from('artist_profiles')
      .select('city, state, postal_code, performance_radius_km')
      .eq('account_id', userId)
      .maybeSingle(),
  ]);

  if (error) {
    throw error;
  }

  if (artistProfileError) {
    throw artistProfileError;
  }

  if (!data) {
    throw new Error('Nao foi possivel abrir essa vaga.');
  }

  const opportunity = mapOpportunityRow(data);
  const [venueProfiles, venueMediaAssets, venueReviewData] = await Promise.all([
    fetchVenueProfilesByIds([opportunity.venue_id]),
    fetchVenueMediaAssetsByVenueId(opportunity.venue_id),
    fetchVenueReviewsByVenueId(opportunity.venue_id),
  ]);
  const venueProfile = venueProfiles.get(opportunity.venue_id) ?? null;
  const artistSummary = (artistProfile ?? null) as ArtistProfileSummaryRow | null;
  const detailArtistRadiusKm = artistSummary?.performance_radius_km ?? null;
  const application = applicationMap.get(opportunity.id) ?? null;
  const contractMap = application ? await fetchContractsByApplicationIds([application.id]) : new Map();
  const contract = application ? contractMap.get(application.id) ?? null : null;
  const [artistCoordinates, venueCoordinates] = await Promise.all([
    resolvePostalCodeCoordinates({
      city: artistSummary?.city ?? null,
      postalCode: artistSummary?.postal_code ?? null,
      state: artistSummary?.state ?? null,
    }),
    resolvePostalCodeCoordinates({
      city: venueProfile?.city ?? null,
      postalCode: venueProfile?.postal_code ?? null,
      state: venueProfile?.state ?? null,
    }),
  ]);
  const distanceKm = calculateDistanceKm(artistCoordinates, venueCoordinates);
  const isWithinTravelRadius =
    distanceKm !== null && detailArtistRadiusKm !== null
      ? distanceKm <= detailArtistRadiusKm
      : null;

  return {
    application,
    contract,
    opportunity: {
      ...opportunity,
      applicationId: application?.id ?? null,
      applicationCreatedAt: application?.created_at ?? null,
      applicationSource: application?.source ?? null,
      applicationStatus: application?.status ?? null,
      contractConfirmedAt: contract?.confirmed_at ?? null,
      contractId: contract?.id ?? null,
      contractStatus: contract?.status ?? null,
      distanceKm,
      isWithinTravelRadius,
      venueCoverImageUrl: venueProfile?.cover_image_url ?? null,
      venueName: venueProfile?.venue_name?.trim() || 'Espaco sem nome',
      venueType: venueProfile?.venue_type ?? null,
    },
    venueMediaAssets,
    venueRatingAverage: venueReviewData.averageRating,
    venueRatingCount: venueReviewData.totalReviews,
    venueProfile,
    venueReviews: venueReviewData.reviews,
  };
}

async function fetchOpenOpportunities({
  eventDateFrom,
}: {
  eventDateFrom: string;
}) {
  const { data, error } = await supabase
    .from('opportunities')
    .select(
      'id, venue_id, title, event_date, start_time, duration_hours, recurrence_days, music_genres, artist_category, budget_cents, city, state, location_label, structure_summary, notes, is_urgent, status, created_at, updated_at',
    )
    .eq('status', 'open')
    .order('event_date', { ascending: true })
    .order('start_time', { ascending: true })
    .limit(48);

  if (error) {
    throw error;
  }

  const visibleItems = mapOpportunityRows(data).filter((item) =>
    isOpportunityVisibleInFeed(item, eventDateFrom),
  );

  return visibleItems.sort(compareOpportunitiesAsc);
}

async function fetchOpportunitiesByIds(opportunityIds: string[]) {
  if (opportunityIds.length === 0) {
    return [] as OpportunityRecord[];
  }

  const { data, error } = await supabase
    .from('opportunities')
    .select(
      'id, venue_id, title, event_date, start_time, duration_hours, recurrence_days, music_genres, artist_category, budget_cents, city, state, location_label, structure_summary, notes, is_urgent, status, created_at, updated_at',
    )
    .in('id', opportunityIds);

  if (error) {
    throw error;
  }

  return mapOpportunityRows(data);
}

async function fetchVenueProfilesByIds(venueIds: string[]) {
  if (venueIds.length === 0) {
    return new Map<string, VenueProfileSummaryRow>();
  }

  const { data, error } = await supabase
    .from('venue_profiles')
    .select('account_id, venue_name, venue_type, city, state, postal_code, address_text, cover_image_url')
    .in('account_id', venueIds);

  if (error) {
    throw error;
  }

  return new Map((data ?? []).map((row) => [row.account_id, row as VenueProfileSummaryRow]));
}

async function fetchVenueMediaAssetsByVenueId(venueId: string) {
  const { data, error } = await supabase
    .from('venue_media_assets')
    .select(
      'id, storage_path, public_url, mime_type, width, height, file_size_bytes, sort_order, created_at',
    )
    .eq('venue_id', venueId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return mapProfileMediaAssets(data);
}

async function fetchVenueReviewsByVenueId(venueId: string) {
  const { data, error } = await supabase
    .from('venue_reviews')
    .select(
      'id, venue_id, opportunity_id, author_artist_id, reviewer_name, reviewer_city, rating, comment, created_at',
    )
    .eq('venue_id', venueId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  const reviews = mapVenueReviewRows(data);
  const averageRating =
    reviews.length > 0
      ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1))
      : null;

  return {
    averageRating,
    reviews: reviews.slice(0, 6),
    totalReviews: reviews.length,
  };
}

async function fetchOpportunityApplicationsByIds(userId: string, opportunityIds: string[]) {
  if (opportunityIds.length === 0) {
    return new Map<string, OpportunityApplicationRecord>();
  }

  const { data, error } = await supabase
    .from('opportunity_applications')
    .select('id, opportunity_id, artist_id, source, status, created_at, updated_at')
    .eq('artist_id', userId)
    .in('opportunity_id', opportunityIds);

  if (error) {
    throw error;
  }

  return new Map((data ?? []).map((row) => [row.opportunity_id, row as OpportunityApplicationRecord]));
}

async function fetchOpportunityApplicationsByArtist(userId: string) {
  const { data, error } = await supabase
    .from('opportunity_applications')
    .select('id, opportunity_id, artist_id, source, status, created_at, updated_at')
    .eq('artist_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as OpportunityApplicationRecord[];
}

async function saveOpportunity({
  input,
  opportunityId,
}: {
  input: SaveOpportunityInput;
  opportunityId?: string;
}) {
  const userId = await requireAuthenticatedUserId();
  const payload = normalizeOpportunityPayload(input);

  if (opportunityId) {
    const { error } = await supabase
      .from('opportunities')
      .update(payload)
      .eq('id', opportunityId)
      .eq('venue_id', userId);

    if (error) {
      throw error;
    }

    reportTelemetryEvent({
      accountId: userId,
      context: {
        status: input.status,
      },
      eventName: 'opportunity_updated',
      opportunityId,
      pathname: '/bar/home',
    });
    return opportunityId;
  }

  const { data, error } = await supabase
    .from('opportunities')
    .insert({
      ...payload,
      venue_id: userId,
    })
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  reportTelemetryEvent({
    accountId: userId,
    context: {
      status: input.status,
    },
    eventName: input.status === 'open' ? 'opportunity_published' : 'opportunity_draft_saved',
    opportunityId: data.id as string,
    pathname: '/bar/home',
  });
  return data.id as string;
}

async function applyToOpportunity(opportunityId: string) {
  const { data, error } = await supabase.rpc('apply_to_open_opportunity', {
    target_opportunity_id: opportunityId,
  });

  if (error) {
    throw normalizeOpportunityApplicationError(error);
  }

  reportTelemetryEvent({
    applicationId: data as string,
    context: {
      source: 'marketplace_apply',
    },
    eventName: 'opportunity_applied',
    opportunityId,
    pathname: '/musician/home',
  });

  notifyMarketplacePushEvent({
    applicationId: data as string,
    eventType: 'opportunity_application_created',
    opportunityId,
  });

  return data as string;
}

async function createDirectOpportunityInvite({
  artistId,
  opportunityId,
}: CreateDirectOpportunityInviteInput) {
  const { data, error } = await supabase.rpc('create_direct_opportunity_invite', {
    target_artist_id: artistId,
    target_opportunity_id: opportunityId,
  });

  if (error) {
    throw normalizeOpportunityApplicationError(error);
  }

  reportTelemetryEvent({
    applicationId: data as string,
    context: {
      source: 'direct_invite',
      targetArtistId: artistId,
    },
    eventName: 'direct_invite_sent',
    opportunityId,
    pathname: '/search',
  });

  notifyMarketplacePushEvent({
    applicationId: data as string,
    eventType: 'direct_invite_sent',
    opportunityId,
  });

  return data as string;
}

async function updateOpportunityStatus({
  opportunityId,
  status,
}: {
  opportunityId: string;
  status: OpportunityStatus;
}) {
  const userId = await requireAuthenticatedUserId();

  const { error } = await supabase
    .from('opportunities')
    .update({ status })
    .eq('id', opportunityId)
    .eq('venue_id', userId);

  if (error) {
    throw error;
  }

  reportTelemetryEvent({
    context: {
      status,
    },
    eventName: 'opportunity_status_changed',
    opportunityId,
    pathname: '/bar/home',
  });
}

function normalizeOpportunityPayload(input: SaveOpportunityInput) {
  const durationHours = sanitizeNonNegativeNumber(input.durationHours);
  const budgetCents = sanitizeNonNegativeNumber(input.budgetCents);
  const eventDate = sanitizeDatabaseDate(input.eventDate);
  const startTime = sanitizeDatabaseTime(input.startTime);
  const recurrenceDays = sanitizeRecurrenceDays(input.recurrenceDays);

  if (!eventDate) {
    throw new Error('Informe uma data valida no formato DD/MM/AAAA.');
  }

  if (!startTime) {
    throw new Error('Informe um horario valido no formato HH:MM.');
  }

  if (durationHours === null || durationHours <= 0) {
    throw new Error('Informe uma duracao valida em horas.');
  }

  if (budgetCents === null) {
    throw new Error('Informe um orcamento valido para a vaga.');
  }

  const city = sanitizeText(input.city);
  const state = sanitizeState(input.state);
  const title = sanitizeText(input.title);
  const musicGenres = sanitizeMusicGenres(input.musicGenres);
  const locationLabel = sanitizeText(input.locationLabel);

  if (!title || musicGenres.length === 0 || !locationLabel || !city || !state) {
    throw new Error('Preencha titulo, estilos, local, cidade e UF antes de salvar.');
  }

  return {
    artist_category: sanitizeText(input.artistCategory),
    budget_cents: budgetCents,
    city,
    duration_hours: durationHours,
    event_date: eventDate,
    is_urgent: input.isUrgent,
    location_label: locationLabel,
    music_genres: musicGenres,
    notes: sanitizeText(input.notes),
    recurrence_days: recurrenceDays,
    start_time: startTime,
    state,
    status: input.status,
    structure_summary: sanitizeText(input.structureSummary),
    title,
  };
}

function mapOpportunityRows(rows: OpportunityRow[] | null | undefined) {
  return (rows ?? []).map((row) => mapOpportunityRow(row));
}

function mapOpportunityRow(row: OpportunityRow) {
  return {
    ...row,
    music_genres: sanitizeMusicGenres(row.music_genres ?? []),
    recurrence_days: sanitizeRecurrenceDays(row.recurrence_days ?? []),
  };
}

function sanitizeText(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function sanitizeState(value: string | null | undefined) {
  const normalized = sanitizeText(value);
  return normalized ? normalized.toUpperCase() : null;
}

function sanitizeNonNegativeNumber(value: number | null | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value) || value < 0) {
    return null;
  }

  return Math.round(value);
}

function sanitizeRecurrenceDays(values: readonly string[]) {
  const orderedValues = WEEKDAY_OPTIONS.map((item) => item.key).filter((key) =>
    values.includes(key),
  );
  return Array.from(new Set(orderedValues));
}

function sanitizeMusicGenres(values: readonly string[]) {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter((value) => value.length > 0),
    ),
  );
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

function normalizeOpportunityApplicationError(error: unknown) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '23505'
  ) {
    return new Error('Voce ja se candidatou a esta vaga.');
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    if (error.message.includes('row-level security')) {
      return new Error('Esta vaga nao aceita novas candidaturas no momento.');
    }

    if (error.message.trim()) {
      return new Error(error.message);
    }
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error('Nao foi possivel enviar sua candidatura.');
}

function mapProfileMediaAssets(rows: ProfileMediaAssetRow[] | null | undefined): ProfileMediaAsset[] {
  return (rows ?? []).map((row) => ({
    createdAt: row.created_at,
    fileSizeBytes: row.file_size_bytes,
    height: row.height,
    id: row.id,
    mimeType: row.mime_type,
    publicUrl: row.public_url,
    sortOrder: row.sort_order,
    storagePath: row.storage_path,
    width: row.width,
  }));
}

function mapVenueReviewRows(rows: VenueReviewRow[] | null | undefined): VenueReviewRecord[] {
  return (rows ?? []).map((row) => ({
    ...row,
    comment: row.comment.trim(),
    reviewer_city: sanitizeText(row.reviewer_city),
    reviewer_name: row.reviewer_name.trim(),
  }));
}

function isOpportunityVisibleInFeed(opportunity: OpportunityRecord, today: string) {
  if (opportunity.recurrence_days.length > 0) {
    return true;
  }

  return opportunity.event_date >= today;
}

function buildOpportunityDate(eventDate: string, startTime: string) {
  const [year, month, day] = eventDate.split('-').map(Number);
  const [hour, minute] = startTime.split(':').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1, hour ?? 0, minute ?? 0, 0, 0);
}

function jsDayToWeekdayKey(day: number): WeekdayKey {
  const match = WEEKDAY_OPTIONS.find((item) => {
    const targetDay =
      item.key === 'sun'
        ? 0
        : item.key === 'mon'
          ? 1
          : item.key === 'tue'
            ? 2
            : item.key === 'wed'
              ? 3
              : item.key === 'thu'
                ? 4
                : item.key === 'fri'
                  ? 5
                  : 6;
    return targetDay === day;
  });

  return match?.key ?? 'sun';
}

function getOpportunitySortDate(opportunity: OpportunityRecord, referenceDate = new Date()) {
  const seriesStartDate = buildOpportunityDate(opportunity.event_date, opportunity.start_time);

  if (opportunity.recurrence_days.length === 0) {
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

    if (!opportunity.recurrence_days.includes(candidateKey)) {
      continue;
    }

    candidate.setHours(hour ?? 0, minute ?? 0, 0, 0);

    if (candidate.getTime() >= referenceDate.getTime()) {
      return candidate;
    }
  }

  return seriesStartDate;
}

export function getOpportunityNextOccurrenceDate(
  opportunity: OpportunityRecord,
  referenceDate = new Date(),
) {
  return getOpportunitySortDate(opportunity, referenceDate);
}

export function getOpportunityLocationMatchScope(
  opportunity: Pick<OpportunityRecord, 'city' | 'state'>,
  artistCity?: string | null,
  artistState?: string | null,
): OpportunityLocationMatchScope {
  const normalizedArtistCity = artistCity?.trim().toLowerCase();
  const normalizedArtistState = artistState?.trim().toUpperCase();
  const normalizedOpportunityCity = opportunity.city?.trim().toLowerCase();
  const normalizedOpportunityState = opportunity.state?.trim().toUpperCase();

  if (
    normalizedArtistCity &&
    normalizedArtistState &&
    normalizedOpportunityCity === normalizedArtistCity &&
    normalizedOpportunityState === normalizedArtistState
  ) {
    return 'city';
  }

  if (normalizedArtistState && normalizedOpportunityState === normalizedArtistState) {
    return 'state';
  }

  return 'national';
}

function compareOpportunityFeedItemsByRelevance(
  left: OpportunityFeedItem,
  right: OpportunityFeedItem,
  artistCity?: string | null,
  artistState?: string | null,
) {
  if ((left.isWithinTravelRadius ?? false) !== (right.isWithinTravelRadius ?? false)) {
    return left.isWithinTravelRadius ? -1 : 1;
  }

  if ((left.distanceKm ?? Number.POSITIVE_INFINITY) !== (right.distanceKm ?? Number.POSITIVE_INFINITY)) {
    return (left.distanceKm ?? Number.POSITIVE_INFINITY) - (right.distanceKm ?? Number.POSITIVE_INFINITY);
  }

  const leftScope = getOpportunityLocationMatchScope(left, artistCity, artistState);
  const rightScope = getOpportunityLocationMatchScope(right, artistCity, artistState);
  const scopeWeight: Record<OpportunityLocationMatchScope, number> = {
    city: 0,
    state: 1,
    national: 2,
  };

  if (scopeWeight[leftScope] !== scopeWeight[rightScope]) {
    return scopeWeight[leftScope] - scopeWeight[rightScope];
  }

  return compareOpportunitiesAsc(left, right);
}

export function compareOpportunitiesAsc(a: OpportunityRecord, b: OpportunityRecord) {
  const left = getOpportunitySortDate(a).getTime();
  const right = getOpportunitySortDate(b).getTime();

  if (left !== right) {
    return left - right;
  }

  return a.title.localeCompare(b.title);
}

export function formatDateForDatabase(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatOpportunityTimeLabel(startTime: string) {
  return startTime.slice(0, 5);
}

export function formatOpportunityDateLabel(eventDate: string, startTime: string) {
  const date = buildOpportunityDate(eventDate, startTime);

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  }).format(date);
}

export function formatOpportunityDurationHours(durationHours: number) {
  return `${durationHours} h`;
}

export function formatRecurrenceDaysLabel(
  values: readonly string[],
  variant: 'short' | 'long' = 'short',
) {
  const labels = sanitizeRecurrenceDays(values).map((value) => {
    const option = WEEKDAY_OPTIONS.find((item) => item.key === value);
    return variant === 'long' ? option?.longLabel ?? value : option?.label ?? value;
  });

  if (labels.length === 0) {
    return '';
  }

  if (labels.length === 1) {
    return labels[0];
  }

  if (labels.length === 2) {
    return `${labels[0]} e ${labels[1]}`;
  }

  return `${labels.slice(0, -1).join(', ')} e ${labels[labels.length - 1]}`;
}

export function formatOpportunityScheduleLabel(opportunity: OpportunityRecord) {
  const durationLabel = formatOpportunityDurationHours(opportunity.duration_hours);

  if (opportunity.recurrence_days.length > 0) {
    return `Toda ${formatRecurrenceDaysLabel(opportunity.recurrence_days)} - ${formatOpportunityTimeLabel(opportunity.start_time)} - ${durationLabel}`;
  }

  return `${formatOpportunityDateLabel(opportunity.event_date, opportunity.start_time)} - ${durationLabel}`;
}

export function formatOpportunityBudget(budgetCents: number) {
  return new Intl.NumberFormat('pt-BR', {
    currency: 'BRL',
    style: 'currency',
  }).format(budgetCents / 100);
}

export function formatOpportunityApplicationStatusLabel(status: OpportunityApplicationStatus) {
  switch (status) {
    case 'accepted':
      return 'Confirmada';
    case 'declined':
      return 'Convite recusado';
    case 'invited':
      return 'Convite recebido';
    case 'rejected':
      return 'Recusada';
    case 'shortlisted':
      return 'Em analise';
    case 'withdrawn':
      return 'Retirada';
    case 'submitted':
    default:
      return 'Candidatura enviada';
  }
}

export function formatOpportunityStatusLabel(status: OpportunityStatus) {
  switch (status) {
    case 'cancelled':
      return 'Cancelada';
    case 'closed':
      return 'Fechada';
    case 'draft':
      return 'Rascunho';
    case 'open':
    default:
      return 'Aberta';
  }
}

export function getOpportunityStatusTone(
  status: OpportunityStatus,
): 'primary' | 'secondary' | 'muted' {
  if (status === 'open') {
    return 'primary';
  }

  if (status === 'draft') {
    return 'secondary';
  }

  return 'muted';
}

export function getOpportunityApplicationTone(
  status: OpportunityApplicationStatus,
): 'primary' | 'secondary' | 'muted' {
  if (status === 'accepted') {
    return 'primary';
  }

  if (status === 'submitted' || status === 'shortlisted' || status === 'invited') {
    return 'secondary';
  }

  return 'muted';
}

export function isDirectInviteApplication(
  source: OpportunityApplicationSource | null | undefined,
) {
  return source === 'direct_invite';
}

export function useBarOpportunityDashboard() {
  return useQuery({
    queryFn: fetchBarOpportunityDashboard,
    queryKey: ['opportunities', 'bar', 'dashboard'],
  });
}

export function useOpportunityEditor(opportunityId?: string) {
  return useQuery({
    queryFn: () => fetchOpportunityEditor(opportunityId),
    queryKey: ['opportunities', 'bar', 'editor', opportunityId ?? 'new'],
  });
}

export function useMusicianOpportunityFeed() {
  return useQuery({
    queryFn: fetchMusicianOpportunityFeed,
    queryKey: ['opportunities', 'musician', 'feed'],
  });
}

export function useMusicianOpportunityDetail(opportunityId?: string) {
  return useQuery({
    enabled: Boolean(opportunityId),
    queryFn: () => fetchMusicianOpportunityDetail(opportunityId!),
    queryKey: ['opportunities', 'musician', 'detail', opportunityId ?? 'missing'],
  });
}

export function useSaveOpportunity(opportunityId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['opportunities', 'save', opportunityId ?? 'new'],
    mutationFn: (input: SaveOpportunityInput) => saveOpportunity({ input, opportunityId }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['opportunities', 'bar'] }),
        queryClient.invalidateQueries({ queryKey: ['opportunities', 'musician', 'feed'] }),
      ]);
    },
  });
}

export function useUpdateOpportunityStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['opportunities', 'status'],
    mutationFn: updateOpportunityStatus,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['opportunities', 'bar'] }),
        queryClient.invalidateQueries({ queryKey: ['opportunities', 'musician', 'feed'] }),
      ]);
    },
  });
}

export function useApplyToOpportunity(opportunityId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['opportunities', 'apply', opportunityId ?? 'missing'],
    mutationFn: () => applyToOpportunity(opportunityId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['opportunities', 'musician', 'feed'] }),
        queryClient.invalidateQueries({
          queryKey: ['opportunities', 'musician', 'detail', opportunityId],
        }),
        queryClient.invalidateQueries({ queryKey: ['opportunities', 'bar'] }),
      ]);
    },
  });
}

export function useCreateDirectOpportunityInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['opportunities', 'invite', 'direct'],
    mutationFn: createDirectOpportunityInvite,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['contracts'] }),
        queryClient.invalidateQueries({ queryKey: ['opportunities'] }),
        queryClient.invalidateQueries({ queryKey: ['chat'] }),
      ]);
    },
  });
}

function shouldIncludeOpportunityFeedItem(item: OpportunityFeedItem) {
  if (item.contractStatus === 'pending_confirmation') {
    return true;
  }

  if (item.contractStatus) {
    return false;
  }

  if (!item.applicationStatus) {
    return item.status === 'open';
  }

  return ['submitted', 'shortlisted', 'invited'].includes(item.applicationStatus);
}
