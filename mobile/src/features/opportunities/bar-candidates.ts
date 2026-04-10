import { useQuery } from '@tanstack/react-query';

import {
  type ContractRecord,
  type ContractStatus,
  fetchActiveContractsByOpportunityIds,
  fetchContractsByApplicationIds,
} from '@/src/features/contracts/contracts';
import { type ProfileMediaAsset } from '@/src/features/profiles/profile-media';
import {
  type OpportunityApplicationRecord,
  type OpportunityApplicationStatus,
  type OpportunityRecord,
  type WeekdayKey,
} from '@/src/features/opportunities/opportunities';
import { supabase } from '@/src/shared/api/supabase/client';

type ArtistProfilePublicRow = {
  account_id: string;
  artist_category: string | null;
  base_cache_cents: number | null;
  bio: string | null;
  city: string | null;
  instagram_handle: string | null;
  performance_radius_km: number | null;
  repertoire_summary: string | null;
  stage_name: string | null;
  state: string | null;
  structure_summary: string | null;
  youtube_url: string | null;
};

type ArtistGenreJoinRow = {
  artist_id: string;
  genre: {
    name: string;
  } | null;
};

type ArtistMediaAssetRow = {
  artist_id: string;
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

type ArtistReviewRow = {
  artist_id: string;
  author_venue_id: string | null;
  comment: string;
  created_at: string;
  id: string;
  opportunity_id: string | null;
  rating: number;
  reviewer_city: string | null;
  reviewer_name: string;
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
  recurrence_days: Array<'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'>;
  start_time: string;
  state: string;
  status: 'draft' | 'open' | 'closed' | 'cancelled';
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
  source: 'marketplace_apply' | 'direct_invite';
  status: OpportunityApplicationStatus;
  updated_at: string;
};

export type ArtistReviewRecord = ArtistReviewRow;

export type BarCandidateListItem = {
  application: OpportunityApplicationRecord;
  artistCategory: string | null;
  artistId: string;
  baseCacheCents: number | null;
  city: string | null;
  contract: ContractRecord | null;
  coverImageUrl: string | null;
  genres: string[];
  ratingAverage: number | null;
  ratingCount: number;
  stageName: string;
  state: string | null;
};

export type BarOpportunityCandidatesData = {
  activeContractApplicationId: string | null;
  activeContractStatus: ContractStatus | null;
  candidates: BarCandidateListItem[];
  opportunity: OpportunityRecord;
};

export type BarCandidateDetailArtist = {
  artistCategory: string | null;
  artistId: string;
  baseCacheCents: number | null;
  bio: string | null;
  city: string | null;
  coverImageUrl: string | null;
  genres: string[];
  instagramHandle: string | null;
  performanceRadiusKm: number | null;
  repertoireSummary: string | null;
  stageName: string;
  state: string | null;
  structureSummary: string | null;
  youtubeUrl: string | null;
};

export type BarCandidateDetailData = {
  application: OpportunityApplicationRecord;
  artist: BarCandidateDetailArtist;
  contract: ContractRecord | null;
  artistMediaAssets: ProfileMediaAsset[];
  artistRatingAverage: number | null;
  artistRatingCount: number;
  artistReviews: ArtistReviewRecord[];
  opportunity: OpportunityRecord;
  opportunityActiveContract: ContractRecord | null;
};

type ArtistReviewAggregate = {
  averageRating: number | null;
  reviews: ArtistReviewRecord[];
  totalReviews: number;
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
    throw new Error('Sessao expirada. Entre novamente para visualizar candidatos.');
  }

  return user.id;
}

async function fetchOwnedOpportunity(opportunityId: string, venueId: string) {
  const { data, error } = await supabase
    .from('opportunities')
    .select(
      'id, venue_id, title, event_date, start_time, duration_hours, recurrence_days, music_genres, artist_category, budget_cents, city, state, location_label, structure_summary, notes, is_urgent, status, created_at, updated_at',
    )
    .eq('id', opportunityId)
    .eq('venue_id', venueId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('Nao foi possivel localizar essa vaga do Bar.');
  }

  return mapOpportunityRow(data as OpportunityRow);
}

async function fetchBarOpportunityCandidates(
  opportunityId: string,
): Promise<BarOpportunityCandidatesData> {
  const userId = await requireAuthenticatedUserId();
  const opportunity = await fetchOwnedOpportunity(opportunityId, userId);

  const { data, error } = await supabase
    .from('opportunity_applications')
    .select('id, opportunity_id, artist_id, source, status, created_at, updated_at')
    .eq('opportunity_id', opportunityId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  const applications = (data ?? []) as OpportunityApplicationRow[];

  if (applications.length === 0) {
    return {
      activeContractApplicationId: null,
      activeContractStatus: null,
      candidates: [],
      opportunity,
    };
  }

  const artistIds = Array.from(new Set(applications.map((item) => item.artist_id)));
  const contractMap = await fetchContractsByApplicationIds(applications.map((item) => item.id));
  const activeContract =
    applications
      .map((application) => contractMap.get(application.id) ?? null)
      .find((contract) => contract && contract.status !== 'cancelled') ?? null;
  const [artistProfiles, artistGenres, artistMedia, artistReviewSummaries] = await Promise.all([
    fetchArtistProfilesByIds(artistIds),
    fetchArtistGenresByArtistIds(artistIds),
    fetchArtistMediaByArtistIds(artistIds),
    fetchArtistReviewSummariesByArtistIds(artistIds),
  ]);

  return {
    activeContractApplicationId: activeContract?.application_id ?? null,
    activeContractStatus: activeContract?.status ?? null,
    candidates: applications.map((application) => {
      const profile = artistProfiles.get(application.artist_id);
      const mediaAssets = artistMedia.get(application.artist_id) ?? [];
      const reviewSummary = artistReviewSummaries.get(application.artist_id) ?? {
        averageRating: null,
        reviews: [],
        totalReviews: 0,
      };

      return {
        application: application as OpportunityApplicationRecord,
        artistCategory: profile?.artist_category ?? null,
        artistId: application.artist_id,
        baseCacheCents: profile?.base_cache_cents ?? null,
        city: profile?.city ?? null,
        contract: contractMap.get(application.id) ?? null,
        coverImageUrl: mediaAssets[0]?.publicUrl ?? null,
        genres: artistGenres.get(application.artist_id) ?? [],
        ratingAverage: reviewSummary.averageRating,
        ratingCount: reviewSummary.totalReviews,
        stageName: profile?.stage_name?.trim() || 'Musico sem nome artistico',
        state: profile?.state ?? null,
      };
    }),
    opportunity,
  };
}

async function fetchBarCandidateDetail(applicationId: string): Promise<BarCandidateDetailData> {
  const userId = await requireAuthenticatedUserId();
  const { data, error } = await supabase
    .from('opportunity_applications')
    .select('id, opportunity_id, artist_id, source, status, created_at, updated_at')
    .eq('id', applicationId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('Nao foi possivel localizar essa candidatura.');
  }

  const application = data as OpportunityApplicationRecord;
  const opportunity = await fetchOwnedOpportunity(application.opportunity_id, userId);
  const artistId = application.artist_id;

  const [artistProfiles, artistGenres, artistMedia, artistReviewSummaries, contractMap, activeContractMap] =
    await Promise.all([
    fetchArtistProfilesByIds([artistId]),
    fetchArtistGenresByArtistIds([artistId]),
    fetchArtistMediaByArtistIds([artistId]),
    fetchArtistReviewSummariesByArtistIds([artistId]),
    fetchContractsByApplicationIds([application.id]),
    fetchActiveContractsByOpportunityIds([application.opportunity_id]),
  ]);

  const profile = artistProfiles.get(artistId);

  if (!profile) {
    throw new Error('Nao foi possivel carregar o perfil publico deste musico.');
  }

  const mediaAssets = artistMedia.get(artistId) ?? [];
  const reviewSummary = artistReviewSummaries.get(artistId) ?? {
    averageRating: null,
    reviews: [],
    totalReviews: 0,
  };

  return {
    application,
    artist: {
      artistCategory: profile.artist_category ?? null,
      artistId,
      baseCacheCents: profile.base_cache_cents ?? null,
      bio: profile.bio ?? null,
      city: profile.city ?? null,
      coverImageUrl: mediaAssets[0]?.publicUrl ?? null,
      genres: artistGenres.get(artistId) ?? [],
      instagramHandle: profile.instagram_handle ?? null,
      performanceRadiusKm: profile.performance_radius_km ?? null,
      repertoireSummary: profile.repertoire_summary ?? null,
      stageName: profile.stage_name?.trim() || 'Musico sem nome artistico',
      state: profile.state ?? null,
      structureSummary: profile.structure_summary ?? null,
      youtubeUrl: profile.youtube_url ?? null,
    },
    contract: contractMap.get(application.id) ?? null,
    artistMediaAssets: mediaAssets,
    artistRatingAverage: reviewSummary.averageRating,
    artistRatingCount: reviewSummary.totalReviews,
    artistReviews: reviewSummary.reviews.slice(0, 6),
    opportunity,
    opportunityActiveContract: activeContractMap.get(opportunity.id) ?? null,
  };
}

async function fetchArtistProfilesByIds(artistIds: string[]) {
  if (artistIds.length === 0) {
    return new Map<string, ArtistProfilePublicRow>();
  }

  const { data, error } = await supabase
    .from('artist_profiles')
    .select(
      'account_id, stage_name, artist_category, city, state, performance_radius_km, base_cache_cents, bio, structure_summary, repertoire_summary, instagram_handle, youtube_url',
    )
    .in('account_id', artistIds);

  if (error) {
    throw error;
  }

  return new Map((data ?? []).map((row) => [row.account_id, row as ArtistProfilePublicRow]));
}

async function fetchArtistGenresByArtistIds(artistIds: string[]) {
  if (artistIds.length === 0) {
    return new Map<string, string[]>();
  }

  const { data, error } = await supabase
    .from('artist_genres')
    .select('artist_id, genre:genres(name)')
    .in('artist_id', artistIds);

  if (error) {
    throw error;
  }

  const genreMap = new Map<string, string[]>();

  for (const row of ((data ?? []) as unknown as ArtistGenreJoinRow[])) {
    const genres = genreMap.get(row.artist_id) ?? [];

    if (row.genre?.name) {
      genres.push(row.genre.name);
    }

    genreMap.set(
      row.artist_id,
      Array.from(new Set(genres)).sort((left, right) => left.localeCompare(right)),
    );
  }

  return genreMap;
}

async function fetchArtistMediaByArtistIds(artistIds: string[]) {
  if (artistIds.length === 0) {
    return new Map<string, ProfileMediaAsset[]>();
  }

  const { data, error } = await supabase
    .from('artist_media_assets')
    .select(
      'artist_id, id, storage_path, public_url, mime_type, width, height, file_size_bytes, sort_order, created_at',
    )
    .in('artist_id', artistIds)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  const mediaMap = new Map<string, ProfileMediaAsset[]>();

  for (const row of ((data ?? []) as ArtistMediaAssetRow[])) {
    const assets = mediaMap.get(row.artist_id) ?? [];
    assets.push(mapProfileMediaAsset(row));
    mediaMap.set(row.artist_id, assets);
  }

  return mediaMap;
}

async function fetchArtistReviewSummariesByArtistIds(artistIds: string[]) {
  if (artistIds.length === 0) {
    return new Map<string, ArtistReviewAggregate>();
  }

  const { data, error } = await supabase
    .from('artist_reviews')
    .select(
      'id, artist_id, opportunity_id, author_venue_id, reviewer_name, reviewer_city, rating, comment, created_at',
    )
    .in('artist_id', artistIds)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  const reviewMap = new Map<string, ArtistReviewAggregate>();

  for (const artistId of artistIds) {
    reviewMap.set(artistId, {
      averageRating: null,
      reviews: [],
      totalReviews: 0,
    });
  }

  for (const row of ((data ?? []) as ArtistReviewRow[])) {
    const current = reviewMap.get(row.artist_id) ?? {
      averageRating: null,
      reviews: [],
      totalReviews: 0,
    };

    current.reviews.push({
      ...row,
      comment: row.comment.trim(),
      reviewer_city: sanitizeText(row.reviewer_city),
      reviewer_name: row.reviewer_name.trim(),
    });
    current.totalReviews += 1;
    reviewMap.set(row.artist_id, current);
  }

  for (const [artistId, summary] of reviewMap.entries()) {
    const average =
      summary.totalReviews > 0
        ? Number(
            (
              summary.reviews.reduce((total, review) => total + review.rating, 0) /
              summary.totalReviews
            ).toFixed(1),
          )
        : null;

    reviewMap.set(artistId, {
      averageRating: average,
      reviews: summary.reviews,
      totalReviews: summary.totalReviews,
    });
  }

  return reviewMap;
}

function mapProfileMediaAsset(row: ArtistMediaAssetRow): ProfileMediaAsset {
  return {
    createdAt: row.created_at,
    fileSizeBytes: row.file_size_bytes,
    height: row.height,
    id: row.id,
    mimeType: row.mime_type,
    publicUrl: row.public_url,
    sortOrder: row.sort_order,
    storagePath: row.storage_path,
    width: row.width,
  };
}

function mapOpportunityRow(row: OpportunityRow): OpportunityRecord {
  return {
    ...row,
    music_genres: sanitizeMusicGenres(row.music_genres ?? []),
    recurrence_days: sanitizeRecurrenceDays(row.recurrence_days ?? []),
  };
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

function sanitizeRecurrenceDays(values: readonly string[]) {
  const allowed: WeekdayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  return Array.from(new Set(values.filter((value): value is WeekdayKey => allowed.includes(value as WeekdayKey))));
}

function sanitizeText(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function useBarOpportunityCandidates(opportunityId?: string) {
  return useQuery({
    enabled: Boolean(opportunityId),
    queryFn: () => fetchBarOpportunityCandidates(opportunityId!),
    queryKey: ['opportunities', 'bar', 'candidates', opportunityId ?? 'missing'],
  });
}

export function useBarCandidateDetail(applicationId?: string) {
  return useQuery({
    enabled: Boolean(applicationId),
    queryFn: () => fetchBarCandidateDetail(applicationId!),
    queryKey: ['opportunities', 'bar', 'candidate-detail', applicationId ?? 'missing'],
  });
}
