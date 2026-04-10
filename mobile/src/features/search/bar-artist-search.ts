import { useQuery } from '@tanstack/react-query';

import { type ProfileMediaAsset } from '@/src/features/profiles/profile-media';
import { supabase } from '@/src/shared/api/supabase/client';
import {
  calculateDistanceKm,
  resolvePostalCodeCoordinates,
  resolvePostalCodeCoordinatesBatch,
} from '@/src/shared/lib/geolocation';

type VenueProfileSearchRow = {
  city: string | null;
  postal_code: string | null;
  state: string | null;
  venue_name: string | null;
};

type ArtistProfileSearchRow = {
  account_id: string;
  artist_category: string | null;
  base_cache_cents: number | null;
  bio: string | null;
  city: string | null;
  instagram_handle: string | null;
  performance_radius_km: number | null;
  postal_code: string | null;
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

export type BarArtistSearchRecord = {
  artistCategory: string | null;
  artistId: string;
  baseCacheCents: number | null;
  bio: string | null;
  city: string | null;
  coverImageUrl: string | null;
  distanceKm: number | null;
  genres: string[];
  instagramHandle: string | null;
  isWithinTravelRadius: boolean | null;
  performanceRadiusKm: number | null;
  ratingAverage: number | null;
  ratingCount: number;
  repertoireSummary: string | null;
  stageName: string;
  state: string | null;
  structureSummary: string | null;
  youtubeUrl: string | null;
};

export type BarArtistSearchData = {
  artists: BarArtistSearchRecord[];
  categories: string[];
  genres: string[];
  venueCity: string | null;
  venueName: string | null;
  venueState: string | null;
};

export type ArtistReviewRecord = ArtistReviewRow;

export type BarArtistDetailData = {
  artist: BarArtistSearchRecord;
  mediaAssets: ProfileMediaAsset[];
  reviews: ArtistReviewRecord[];
};

type ArtistReviewAggregate = {
  averageRating: number | null;
  reviews: ArtistReviewRecord[];
  totalReviews: number;
};

async function requireAuthenticatedBarId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error('Sessao expirada. Entre novamente para buscar artistas.');
  }

  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select('account_type')
    .eq('id', user.id)
    .maybeSingle();

  if (accountError) {
    throw accountError;
  }

  if (!account || account.account_type !== 'bar') {
    throw new Error('A busca ativa de artistas esta disponivel apenas para contas Bar.');
  }

  return user.id;
}

async function fetchBarArtistSearchData(): Promise<BarArtistSearchData> {
  const userId = await requireAuthenticatedBarId();

  const [
    { data: venueProfile, error: venueError },
    { data: artistProfiles, error: artistProfilesError },
    { data: artistGenres, error: artistGenresError },
    { data: artistMedia, error: artistMediaError },
    { data: artistReviews, error: artistReviewsError },
  ] = await Promise.all([
    supabase
      .from('venue_profiles')
      .select('venue_name, city, state, postal_code')
      .eq('account_id', userId)
      .maybeSingle(),
    supabase
      .from('artist_profiles')
      .select(
        'account_id, stage_name, artist_category, city, state, postal_code, performance_radius_km, base_cache_cents, bio, structure_summary, repertoire_summary, instagram_handle, youtube_url',
      ),
    supabase.from('artist_genres').select('artist_id, genre:genres(name)'),
    supabase
      .from('artist_media_assets')
      .select(
        'artist_id, id, storage_path, public_url, mime_type, width, height, file_size_bytes, sort_order, created_at',
      )
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase
      .from('artist_reviews')
      .select(
        'id, artist_id, opportunity_id, author_venue_id, reviewer_name, reviewer_city, rating, comment, created_at',
      )
      .order('created_at', { ascending: false }),
  ]);

  if (venueError) {
    throw venueError;
  }

  if (artistProfilesError) {
    throw artistProfilesError;
  }

  if (artistGenresError) {
    throw artistGenresError;
  }

  if (artistMediaError) {
    throw artistMediaError;
  }

  if (artistReviewsError) {
    throw artistReviewsError;
  }

  const artistIds = ((artistProfiles ?? []) as ArtistProfileSearchRow[]).map((row) => row.account_id);
  const venueSummary = (venueProfile as VenueProfileSearchRow | null) ?? null;
  const genreMap = buildArtistGenresMap((artistGenres ?? []) as unknown as ArtistGenreJoinRow[]);
  const mediaMap = buildArtistMediaMap((artistMedia ?? []) as ArtistMediaAssetRow[]);
  const reviewMap = buildArtistReviewSummaries((artistReviews ?? []) as ArtistReviewRow[], artistIds);
  const coordinateMap = await resolvePostalCodeCoordinatesBatch([
    {
      city: venueSummary?.city ?? null,
      key: `venue:${userId}`,
      postalCode: venueSummary?.postal_code ?? null,
      state: venueSummary?.state ?? null,
    },
    ...((artistProfiles ?? []) as ArtistProfileSearchRow[]).map((profile) => ({
      city: profile.city,
      key: `artist:${profile.account_id}`,
      postalCode: profile.postal_code,
      state: profile.state,
    })),
  ]);
  const venueCoordinates = coordinateMap.get(`venue:${userId}`) ?? null;
  const artists = ((artistProfiles ?? []) as ArtistProfileSearchRow[])
    .map((profile) => {
      const mediaAssets = mediaMap.get(profile.account_id) ?? [];
      const reviewSummary = reviewMap.get(profile.account_id) ?? {
        averageRating: null,
        reviews: [],
        totalReviews: 0,
      };
      const artistCoordinates = coordinateMap.get(`artist:${profile.account_id}`) ?? null;
      const distanceKm = calculateDistanceKm(venueCoordinates, artistCoordinates);
      const isWithinTravelRadius =
        distanceKm !== null && profile.performance_radius_km !== null
          ? distanceKm <= profile.performance_radius_km
          : null;

      return {
        artistCategory: sanitizeText(profile.artist_category),
        artistId: profile.account_id,
        baseCacheCents: profile.base_cache_cents ?? null,
        bio: sanitizeText(profile.bio),
        city: sanitizeText(profile.city),
        coverImageUrl: mediaAssets[0]?.publicUrl ?? null,
        distanceKm,
        genres: genreMap.get(profile.account_id) ?? [],
        instagramHandle: sanitizeText(profile.instagram_handle),
        isWithinTravelRadius,
        performanceRadiusKm: profile.performance_radius_km ?? null,
        ratingAverage: reviewSummary.averageRating,
        ratingCount: reviewSummary.totalReviews,
        repertoireSummary: sanitizeText(profile.repertoire_summary),
        stageName: profile.stage_name?.trim() || 'Musico sem nome artistico',
        state: sanitizeText(profile.state),
        structureSummary: sanitizeText(profile.structure_summary),
        youtubeUrl: sanitizeText(profile.youtube_url),
      } satisfies BarArtistSearchRecord;
    })
    .sort((left, right) => {
      if ((left.isWithinTravelRadius ?? false) !== (right.isWithinTravelRadius ?? false)) {
        return left.isWithinTravelRadius ? -1 : 1;
      }

      if ((left.distanceKm ?? Number.POSITIVE_INFINITY) !== (right.distanceKm ?? Number.POSITIVE_INFINITY)) {
        return (left.distanceKm ?? Number.POSITIVE_INFINITY) - (right.distanceKm ?? Number.POSITIVE_INFINITY);
      }

      if ((right.ratingAverage ?? 0) !== (left.ratingAverage ?? 0)) {
        return (right.ratingAverage ?? 0) - (left.ratingAverage ?? 0);
      }

      return left.stageName.localeCompare(right.stageName);
    });

  return {
    artists,
    categories: Array.from(
      new Set(
        artists
          .map((artist) => artist.artistCategory)
          .filter((value): value is string => Boolean(value)),
      ),
    ).sort((left, right) => left.localeCompare(right)),
    genres: Array.from(new Set(artists.flatMap((artist) => artist.genres))).sort((left, right) =>
      left.localeCompare(right),
    ),
    venueCity: sanitizeText((venueProfile as VenueProfileSearchRow | null)?.city),
    venueName: sanitizeText((venueProfile as VenueProfileSearchRow | null)?.venue_name),
    venueState: sanitizeText((venueProfile as VenueProfileSearchRow | null)?.state),
  };
}

async function fetchBarArtistDetail(artistId: string): Promise<BarArtistDetailData> {
  await requireAuthenticatedBarId();

  const [
    { data: artistProfile, error: artistError },
    { data: artistGenres, error: genresError },
    { data: artistMedia, error: artistMediaError },
    { data: artistReviews, error: artistReviewsError },
  ] = await Promise.all([
    supabase
      .from('artist_profiles')
      .select(
        'account_id, stage_name, artist_category, city, state, postal_code, performance_radius_km, base_cache_cents, bio, structure_summary, repertoire_summary, instagram_handle, youtube_url',
      )
      .eq('account_id', artistId)
      .maybeSingle(),
    supabase.from('artist_genres').select('artist_id, genre:genres(name)').eq('artist_id', artistId),
    supabase
      .from('artist_media_assets')
      .select(
        'artist_id, id, storage_path, public_url, mime_type, width, height, file_size_bytes, sort_order, created_at',
      )
      .eq('artist_id', artistId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase
      .from('artist_reviews')
      .select(
        'id, artist_id, opportunity_id, author_venue_id, reviewer_name, reviewer_city, rating, comment, created_at',
      )
      .eq('artist_id', artistId)
      .order('created_at', { ascending: false }),
  ]);

  if (artistError) {
    throw artistError;
  }

  if (!artistProfile) {
    throw new Error('Nao foi possivel localizar esse artista.');
  }

  if (genresError) {
    throw genresError;
  }

  if (artistMediaError) {
    throw artistMediaError;
  }

  if (artistReviewsError) {
    throw artistReviewsError;
  }

  const genreMap = buildArtistGenresMap((artistGenres ?? []) as unknown as ArtistGenreJoinRow[]);
  const mediaMap = buildArtistMediaMap((artistMedia ?? []) as ArtistMediaAssetRow[]);
  const reviewSummary = buildArtistReviewSummaries(
    (artistReviews ?? []) as ArtistReviewRow[],
    [artistId],
  ).get(artistId) ?? {
    averageRating: null,
    reviews: [],
    totalReviews: 0,
  };

  const artist = artistProfile as ArtistProfileSearchRow;
  const mediaAssets = mediaMap.get(artistId) ?? [];
  const { data: venueProfile } = await supabase
    .from('venue_profiles')
    .select('city, state, postal_code')
    .eq('account_id', await requireAuthenticatedBarId())
    .maybeSingle();
  const [artistCoordinates, venueCoordinates] = await Promise.all([
    resolvePostalCodeCoordinates({
      city: artist.city,
      postalCode: artist.postal_code,
      state: artist.state,
    }),
    resolvePostalCodeCoordinates({
      city: (venueProfile as VenueProfileSearchRow | null)?.city ?? null,
      postalCode: (venueProfile as VenueProfileSearchRow | null)?.postal_code ?? null,
      state: (venueProfile as VenueProfileSearchRow | null)?.state ?? null,
    }),
  ]);
  const distanceKm = calculateDistanceKm(venueCoordinates, artistCoordinates);
  const isWithinTravelRadius =
    distanceKm !== null && artist.performance_radius_km !== null
      ? distanceKm <= artist.performance_radius_km
      : null;

  return {
    artist: {
      artistCategory: sanitizeText(artist.artist_category),
      artistId,
      baseCacheCents: artist.base_cache_cents ?? null,
      bio: sanitizeText(artist.bio),
      city: sanitizeText(artist.city),
      coverImageUrl: mediaAssets[0]?.publicUrl ?? null,
      distanceKm,
      genres: genreMap.get(artistId) ?? [],
      instagramHandle: sanitizeText(artist.instagram_handle),
      isWithinTravelRadius,
      performanceRadiusKm: artist.performance_radius_km ?? null,
      ratingAverage: reviewSummary.averageRating,
      ratingCount: reviewSummary.totalReviews,
      repertoireSummary: sanitizeText(artist.repertoire_summary),
      stageName: artist.stage_name?.trim() || 'Musico sem nome artistico',
      state: sanitizeText(artist.state),
      structureSummary: sanitizeText(artist.structure_summary),
      youtubeUrl: sanitizeText(artist.youtube_url),
    },
    mediaAssets,
    reviews: reviewSummary.reviews,
  };
}

function buildArtistGenresMap(rows: ArtistGenreJoinRow[]) {
  const genreMap = new Map<string, string[]>();

  for (const row of rows) {
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

function buildArtistMediaMap(rows: ArtistMediaAssetRow[]) {
  const mediaMap = new Map<string, ProfileMediaAsset[]>();

  for (const row of rows) {
    const assets = mediaMap.get(row.artist_id) ?? [];
    assets.push(mapProfileMediaAsset(row));
    mediaMap.set(row.artist_id, assets);
  }

  return mediaMap;
}

function buildArtistReviewSummaries(rows: ArtistReviewRow[], artistIds: string[]) {
  const reviewMap = new Map<string, ArtistReviewAggregate>();

  for (const artistId of artistIds) {
    reviewMap.set(artistId, {
      averageRating: null,
      reviews: [],
      totalReviews: 0,
    });
  }

  for (const row of rows) {
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

function sanitizeText(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function useBarArtistSearch() {
  return useQuery({
    queryFn: fetchBarArtistSearchData,
    queryKey: ['search', 'bar', 'artists'],
  });
}

export function useBarArtistDetail(artistId?: string) {
  return useQuery({
    enabled: Boolean(artistId),
    queryFn: () => fetchBarArtistDetail(artistId!),
    queryKey: ['search', 'bar', 'artist-detail', artistId ?? 'missing'],
  });
}
