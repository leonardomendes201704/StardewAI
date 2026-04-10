import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { reportTelemetryEvent } from '@/src/features/observability/telemetry';
import { supabase } from '@/src/shared/api/supabase/client';
import { type ProfileMediaAsset } from '@/src/features/profiles/profile-media';

type AccountRow = {
  created_at: string;
  display_name: string | null;
  email: string | null;
  id: string;
  onboarding_completed: boolean;
  profile_completed: boolean;
};

type VenueProfileRow = {
  account_id: string;
  address_complement: string | null;
  address_number: string | null;
  address_text: string | null;
  bio: string | null;
  capacity: number | null;
  city: string | null;
  cover_image_url: string | null;
  created_at: string;
  neighborhood: string | null;
  performance_days: string[];
  postal_code: string | null;
  state: string | null;
  street: string | null;
  updated_at: string;
  venue_name: string | null;
  venue_type: string | null;
};

type ArtistProfileRow = {
  account_id: string;
  artist_category: string | null;
  base_cache_cents: number | null;
  bio: string | null;
  city: string | null;
  created_at: string;
  instagram_handle: string | null;
  performance_radius_km: number | null;
  postal_code: string | null;
  repertoire_summary: string | null;
  stage_name: string | null;
  state: string | null;
  structure_summary: string | null;
  updated_at: string;
  youtube_url: string | null;
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

export type GenreOption = {
  id: number;
  name: string;
  slug: string;
};

export type VenueProfileEditorData = {
  account: AccountRow;
  mediaAssets: ProfileMediaAsset[];
  venueProfile: VenueProfileRow | null;
};

export type ArtistProfileEditorData = {
  account: AccountRow;
  artistProfile: ArtistProfileRow | null;
  genres: GenreOption[];
  mediaAssets: ProfileMediaAsset[];
  selectedGenreIds: number[];
};

export type SaveVenueProfileInput = {
  addressComplement: string;
  addressNumber: string;
  bio: string;
  capacity: number | null;
  city: string;
  neighborhood: string;
  performanceDays: string[];
  postalCode: string;
  state: string;
  street: string;
  venueName: string;
  venueType: string;
};

export type SaveArtistProfileInput = {
  artistCategory: string;
  baseCacheCents: number | null;
  bio: string;
  city: string;
  instagramHandle: string;
  performanceRadiusKm: number | null;
  postalCode: string;
  repertoireSummary: string;
  selectedGenreIds: number[];
  stageName: string;
  state: string;
  structureSummary: string;
  youtubeUrl: string;
};

export type PostalCodeLookupResult = {
  city: string;
  neighborhood: string;
  postalCode: string;
  state: string;
  street: string;
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
    throw new Error('Sessao expirada. Entre novamente para editar o perfil.');
  }

  return user.id;
}

async function fetchVenueProfileEditor(): Promise<VenueProfileEditorData> {
  const userId = await requireAuthenticatedUserId();

  const [
    { data: account, error: accountError },
    { data: venueProfile, error: venueError },
    { data: venueMediaAssets, error: venueMediaAssetsError },
  ] =
    await Promise.all([
      supabase
        .from('accounts')
        .select('id, email, display_name, profile_completed, onboarding_completed, created_at')
        .eq('id', userId)
        .single(),
      supabase
        .from('venue_profiles')
        .select(
          'account_id, venue_name, venue_type, postal_code, street, address_number, address_complement, city, state, neighborhood, address_text, capacity, performance_days, bio, cover_image_url, created_at, updated_at',
        )
        .eq('account_id', userId)
        .maybeSingle(),
      supabase
        .from('venue_media_assets')
        .select(
          'id, storage_path, public_url, mime_type, width, height, file_size_bytes, sort_order, created_at',
        )
        .eq('venue_id', userId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true }),
    ]);

  if (accountError) {
    throw accountError;
  }

  if (venueError) {
    throw venueError;
  }

  if (venueMediaAssetsError) {
    throw venueMediaAssetsError;
  }

  return {
    account: account as AccountRow,
    mediaAssets: mapProfileMediaAssets(venueMediaAssets),
    venueProfile: venueProfile as VenueProfileRow | null,
  };
}

async function fetchArtistProfileEditor(): Promise<ArtistProfileEditorData> {
  const userId = await requireAuthenticatedUserId();

  const [
    { data: account, error: accountError },
    { data: artistProfile, error: artistError },
    { data: genres, error: genresError },
    { data: artistGenres, error: artistGenresError },
    { data: artistMediaAssets, error: artistMediaAssetsError },
  ] = await Promise.all([
    supabase
      .from('accounts')
      .select('id, email, display_name, profile_completed, onboarding_completed, created_at')
      .eq('id', userId)
      .single(),
    supabase
      .from('artist_profiles')
      .select(
        'account_id, stage_name, artist_category, postal_code, city, state, performance_radius_km, base_cache_cents, bio, structure_summary, repertoire_summary, instagram_handle, youtube_url, created_at, updated_at',
      )
      .eq('account_id', userId)
      .maybeSingle(),
    supabase.from('genres').select('id, name, slug').order('name'),
    supabase.from('artist_genres').select('genre_id').eq('artist_id', userId),
    supabase
      .from('artist_media_assets')
      .select(
        'id, storage_path, public_url, mime_type, width, height, file_size_bytes, sort_order, created_at',
      )
      .eq('artist_id', userId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),
  ]);

  if (accountError) {
    throw accountError;
  }

  if (artistError) {
    throw artistError;
  }

  if (genresError) {
    throw genresError;
  }

  if (artistGenresError) {
    throw artistGenresError;
  }

  if (artistMediaAssetsError) {
    throw artistMediaAssetsError;
  }

  return {
    account: account as AccountRow,
    artistProfile: artistProfile as ArtistProfileRow | null,
    genres: (genres ?? []) as GenreOption[],
    mediaAssets: mapProfileMediaAssets(artistMediaAssets),
    selectedGenreIds: (artistGenres ?? []).map((item) => item.genre_id as number),
  };
}

async function saveVenueProfile(input: SaveVenueProfileInput) {
  const userId = await requireAuthenticatedUserId();
  const postalCode = sanitizePostalCode(input.postalCode);
  const street = sanitizeText(input.street);
  const addressNumber = sanitizeText(input.addressNumber);
  const addressComplement = sanitizeText(input.addressComplement);
  const city = sanitizeText(input.city);
  const state = sanitizeText(input.state);
  const neighborhood = sanitizeText(input.neighborhood);
  const venueProfile = {
    address_complement: addressComplement,
    address_number: addressNumber,
    address_text: buildVenueAddressText({
      addressComplement,
      addressNumber,
      city,
      neighborhood,
      state,
      street,
    }),
    bio: sanitizeText(input.bio),
    capacity: sanitizeNonNegativeNumber(input.capacity),
    city,
    neighborhood,
    performance_days: sanitizeStringArray(input.performanceDays),
    postal_code: postalCode,
    state,
    street,
    venue_name: sanitizeText(input.venueName),
    venue_type: sanitizeText(input.venueType),
  };

  const { error: profileError } = await supabase
    .from('venue_profiles')
    .update(venueProfile)
    .eq('account_id', userId);

  if (profileError) {
    throw profileError;
  }

  const profileCompleted = Boolean(
    venueProfile.venue_name &&
      venueProfile.venue_type &&
      venueProfile.postal_code &&
      venueProfile.street &&
      venueProfile.city &&
      venueProfile.state &&
      venueProfile.address_number,
  );

  const { error: accountError } = await supabase
    .from('accounts')
    .update({
      display_name: venueProfile.venue_name,
      onboarding_completed: profileCompleted,
      profile_completed: profileCompleted,
    })
    .eq('id', userId);

  if (accountError) {
    throw accountError;
  }

  reportTelemetryEvent({
    accountId: userId,
    accountType: 'bar',
    context: {
      profileCompleted,
    },
    eventName: 'profile_saved',
    pathname: '/bar/profile',
  });
}

async function saveArtistProfile(input: SaveArtistProfileInput) {
  const userId = await requireAuthenticatedUserId();
  const artistProfile = {
    artist_category: sanitizeText(input.artistCategory),
    base_cache_cents: sanitizeNonNegativeNumber(input.baseCacheCents),
    bio: sanitizeText(input.bio),
    city: sanitizeText(input.city),
    instagram_handle: sanitizeText(input.instagramHandle),
    performance_radius_km: sanitizeNonNegativeNumber(input.performanceRadiusKm),
    postal_code: sanitizePostalCode(input.postalCode),
    repertoire_summary: sanitizeText(input.repertoireSummary),
    stage_name: sanitizeText(input.stageName),
    state: sanitizeText(input.state),
    structure_summary: sanitizeText(input.structureSummary),
    youtube_url: sanitizeText(input.youtubeUrl),
  };
  const selectedGenreIds = Array.from(
    new Set(
      input.selectedGenreIds.filter(
        (value): value is number => Number.isInteger(value) && Number(value) > 0,
      ),
    ),
  );

  const { error: profileError } = await supabase
    .from('artist_profiles')
    .update(artistProfile)
    .eq('account_id', userId);

  if (profileError) {
    throw profileError;
  }

  const { error: deleteGenresError } = await supabase
    .from('artist_genres')
    .delete()
    .eq('artist_id', userId);

  if (deleteGenresError) {
    throw deleteGenresError;
  }

  if (selectedGenreIds.length > 0) {
    const { error: insertGenresError } = await supabase.from('artist_genres').insert(
      selectedGenreIds.map((genreId) => ({
        artist_id: userId,
        genre_id: genreId,
      })),
    );

    if (insertGenresError) {
      throw insertGenresError;
    }
  }

  const profileCompleted = Boolean(
    artistProfile.stage_name &&
      artistProfile.artist_category &&
      artistProfile.postal_code &&
      artistProfile.city &&
      artistProfile.state &&
      artistProfile.base_cache_cents !== null &&
      selectedGenreIds.length > 0,
  );

  const { error: accountError } = await supabase
    .from('accounts')
    .update({
      display_name: artistProfile.stage_name,
      onboarding_completed: profileCompleted,
      profile_completed: profileCompleted,
    })
    .eq('id', userId);

  if (accountError) {
    throw accountError;
  }

  reportTelemetryEvent({
    accountId: userId,
    accountType: 'musician',
    context: {
      profileCompleted,
      selectedGenreCount: selectedGenreIds.length,
    },
    eventName: 'profile_saved',
    pathname: '/musician/profile',
  });
}

function sanitizeText(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function sanitizePostalCode(value: string | null | undefined) {
  const normalized = value?.replace(/\D+/g, '') ?? '';
  return normalized.length === 8 ? normalized : null;
}

function buildVenueAddressText({
  addressComplement,
  addressNumber,
  city,
  neighborhood,
  state,
  street,
}: {
  addressComplement: string | null;
  addressNumber: string | null;
  city: string | null;
  neighborhood: string | null;
  state: string | null;
  street: string | null;
}) {
  if (!street) {
    return null;
  }

  const lineParts = [street];

  if (addressNumber) {
    lineParts.push(addressNumber);
  }

  if (addressComplement) {
    lineParts.push(addressComplement);
  }

  const locationParts = [neighborhood, city, state].filter(
    (value): value is string => Boolean(value),
  );

  return [...lineParts, ...locationParts].join(' - ');
}

function sanitizeStringArray(values: string[]) {
  return values
    .map((value) => value.trim())
    .filter((value, index, items) => value.length > 0 && items.indexOf(value) === index);
}

function sanitizeNonNegativeNumber(value: number | null | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value) || value < 0) {
    return null;
  }

  return Math.round(value);
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

async function fetchPostalCodeLookup(postalCode: string): Promise<PostalCodeLookupResult> {
  const normalizedPostalCode = sanitizePostalCode(postalCode);

  if (!normalizedPostalCode) {
    throw new Error('Informe um CEP com 8 digitos.');
  }

  const response = await fetch(`https://viacep.com.br/ws/${normalizedPostalCode}/json/`);

  if (!response.ok) {
    throw new Error('Nao foi possivel consultar o CEP agora.');
  }

  const data = (await response.json()) as {
    bairro?: string;
    erro?: boolean;
    localidade?: string;
    logradouro?: string;
    uf?: string;
  };

  if (data.erro) {
    throw new Error('CEP nao encontrado no ViaCEP.');
  }

  const city = data.localidade?.trim();
  const neighborhood = data.bairro?.trim() ?? '';
  const state = data.uf?.trim().toUpperCase();
  const street = data.logradouro?.trim() ?? '';

  if (!city || !state) {
    throw new Error('O ViaCEP nao retornou cidade e UF validos para este CEP.');
  }

  return {
    city,
    neighborhood,
    postalCode: normalizedPostalCode,
    state,
    street,
  };
}

export function useVenueProfileEditor() {
  return useQuery({
    queryFn: fetchVenueProfileEditor,
    queryKey: ['profile-editor', 'bar'],
  });
}

export function useArtistProfileEditor() {
  return useQuery({
    queryFn: fetchArtistProfileEditor,
    queryKey: ['profile-editor', 'musician'],
  });
}

export function useSaveVenueProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['profile-editor', 'bar', 'save'],
    mutationFn: saveVenueProfile,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profile-editor', 'bar'] }),
        queryClient.invalidateQueries({ queryKey: ['registration-snapshot'] }),
      ]);
    },
  });
}

export function useSaveArtistProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['profile-editor', 'musician', 'save'],
    mutationFn: saveArtistProfile,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profile-editor', 'musician'] }),
        queryClient.invalidateQueries({ queryKey: ['registration-snapshot'] }),
      ]);
    },
  });
}

export function usePostalCodeLookup(postalCode: string) {
  const normalizedPostalCode = sanitizePostalCode(postalCode);

  return useQuery({
    enabled: Boolean(normalizedPostalCode),
    queryFn: () => fetchPostalCodeLookup(normalizedPostalCode ?? ''),
    queryKey: ['profile-editor', 'postal-code', normalizedPostalCode],
    staleTime: 24 * 60 * 60 * 1000,
  });
}
