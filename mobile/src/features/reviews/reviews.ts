import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  formatContractAgendaScheduleLabel,
  type ContractAgendaOpportunity,
  type ContractRecord,
} from '@/src/features/contracts/contracts';
import { reportTelemetryEvent } from '@/src/features/observability/telemetry';
import { type AccountType } from '@/src/features/session/account';
import { supabase } from '@/src/shared/api/supabase/client';

type VenueProfileReviewRow = {
  account_id: string;
  city: string | null;
  cover_image_url: string | null;
  state: string | null;
  venue_name: string | null;
};

type ArtistProfileReviewRow = {
  account_id: string;
  city: string | null;
  stage_name: string | null;
  state: string | null;
};

type OpportunityReviewRow = {
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

type ContractReviewRow = {
  application_id: string;
  artist_id: string;
  cancelled_at: string | null;
  completed_at: string | null;
  confirmed_at: string | null;
  created_at: string;
  id: string;
  opportunity_id: string;
  status: ContractRecord['status'];
  updated_at: string;
  venue_id: string;
};

type VenueReviewRow = {
  author_artist_id: string | null;
  comment: string;
  created_at: string;
  id: string;
  opportunity_id: string | null;
  professionalism_rating: number;
  punctuality_rating: number;
  quality_rating: number;
  rating: number;
  reviewer_city: string | null;
  reviewer_name: string;
  updated_at: string;
  venue_id: string;
};

type ArtistReviewRow = {
  artist_id: string;
  author_venue_id: string | null;
  comment: string;
  created_at: string;
  id: string;
  opportunity_id: string | null;
  professionalism_rating: number;
  punctuality_rating: number;
  quality_rating: number;
  rating: number;
  reviewer_city: string | null;
  reviewer_name: string;
  updated_at: string;
};

export type EditableReview = {
  comment: string;
  createdAt: string;
  id: string;
  professionalismRating: number;
  punctualityRating: number;
  qualityRating: number;
  rating: number;
  reviewerCity: string | null;
  reviewerName: string;
  updatedAt: string;
};

export type CompletedContractReviewData = {
  accountType: AccountType;
  contract: ContractRecord;
  counterpartId: string;
  counterpartImageUrl: string | null;
  counterpartMeta: string | null;
  counterpartName: string;
  existingReview: EditableReview | null;
  opportunity: ContractAgendaOpportunity;
  reviewActionLabel: string;
  reviewHeadline: string;
  reviewerCity: string | null;
  reviewerName: string;
};

export type SaveCompletedReviewInput = {
  comment: string;
  contractId: string;
  professionalismRating: number;
  punctualityRating: number;
  qualityRating: number;
};

function toError(error: unknown, fallbackMessage: string) {
  if (error instanceof Error) {
    return error;
  }

  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
  ) {
    return new Error((error as { message: string }).message);
  }

  return new Error(fallbackMessage);
}

async function requireAuthenticatedUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw toError(error, 'Sessao expirada. Entre novamente para avaliar este evento.');
  }

  if (!user) {
    throw new Error('Sessao expirada. Entre novamente para avaliar este evento.');
  }

  return user.id;
}

async function fetchCompletedContractForRole(contractId: string, accountType: AccountType) {
  const userId = await requireAuthenticatedUserId();
  const roleColumn = accountType === 'bar' ? 'venue_id' : 'artist_id';
  const { data, error } = await supabase
    .from('contracts')
    .select(
      'id, application_id, opportunity_id, venue_id, artist_id, status, confirmed_at, completed_at, cancelled_at, created_at, updated_at',
    )
    .eq('id', contractId)
    .eq(roleColumn, userId)
    .maybeSingle();

  if (error) {
    throw toError(error, 'Nao foi possivel localizar esta contratacao para avaliacao.');
  }

  if (!data) {
    throw new Error('Nao foi possivel localizar esta contratacao para avaliacao.');
  }

  const contract = data as ContractReviewRow as ContractRecord;

  if (contract.status !== 'completed') {
    throw new Error('A avaliacao so fica disponivel quando o show e marcado como concluido.');
  }

  return {
    contract,
    userId,
  };
}

async function fetchOpportunityReviewContext(opportunityId: string) {
  const { data, error } = await supabase
    .from('opportunities')
    .select(
      'id, title, event_date, start_time, duration_hours, recurrence_days, city, state, location_label, artist_category',
    )
    .eq('id', opportunityId)
    .maybeSingle();

  if (error) {
    throw toError(error, 'A oportunidade vinculada a este show nao foi localizada.');
  }

  if (!data) {
    throw new Error('A oportunidade vinculada a este show nao foi localizada.');
  }

  return data as OpportunityReviewRow as ContractAgendaOpportunity;
}

function buildCityStateLabel(city: string | null | undefined, state: string | null | undefined) {
  return [city, state].filter((value): value is string => Boolean(value)).join('/') || null;
}

function mapVenueReview(row: VenueReviewRow | null) {
  if (!row) {
    return null;
  }

  return {
    comment: row.comment,
    createdAt: row.created_at,
    id: row.id,
    professionalismRating: row.professionalism_rating,
    punctualityRating: row.punctuality_rating,
    qualityRating: row.quality_rating,
    rating: row.rating,
    reviewerCity: row.reviewer_city,
    reviewerName: row.reviewer_name,
    updatedAt: row.updated_at,
  } satisfies EditableReview;
}

function mapArtistReview(row: ArtistReviewRow | null) {
  if (!row) {
    return null;
  }

  return {
    comment: row.comment,
    createdAt: row.created_at,
    id: row.id,
    professionalismRating: row.professionalism_rating,
    punctualityRating: row.punctuality_rating,
    qualityRating: row.quality_rating,
    rating: row.rating,
    reviewerCity: row.reviewer_city,
    reviewerName: row.reviewer_name,
    updatedAt: row.updated_at,
  } satisfies EditableReview;
}

async function fetchMusicianCompletedContractReview(
  contractId: string,
): Promise<CompletedContractReviewData> {
  const { contract, userId } = await fetchCompletedContractForRole(contractId, 'musician');
  const opportunity = await fetchOpportunityReviewContext(contract.opportunity_id);

  const [
    { data: venueData, error: venueError },
    { data: artistData, error: artistError },
    { data: reviewData, error: reviewError },
  ] = await Promise.all([
    supabase
      .from('venue_profiles')
      .select('account_id, venue_name, cover_image_url, city, state')
      .eq('account_id', contract.venue_id)
      .maybeSingle(),
    supabase
      .from('artist_profiles')
      .select('account_id, stage_name, city, state')
      .eq('account_id', userId)
      .maybeSingle(),
    supabase
      .from('venue_reviews')
      .select(
        'id, venue_id, opportunity_id, author_artist_id, reviewer_name, reviewer_city, rating, punctuality_rating, quality_rating, professionalism_rating, comment, created_at, updated_at',
      )
      .eq('venue_id', contract.venue_id)
      .eq('opportunity_id', contract.opportunity_id)
      .eq('author_artist_id', userId)
      .maybeSingle(),
  ]);

  if (venueError) {
    throw toError(venueError, 'Nao foi possivel carregar os dados do Bar para avaliacao.');
  }

  if (artistError) {
    throw toError(artistError, 'Nao foi possivel carregar seus dados de perfil para avaliacao.');
  }

  if (reviewError) {
    throw toError(reviewError, 'Nao foi possivel carregar sua avaliacao anterior do Bar.');
  }

  const venue = venueData as VenueProfileReviewRow | null;
  const artist = artistData as ArtistProfileReviewRow | null;

  return {
    accountType: 'musician',
    contract,
    counterpartId: contract.venue_id,
    counterpartImageUrl: venue?.cover_image_url ?? null,
    counterpartMeta: buildCityStateLabel(venue?.city, venue?.state),
    counterpartName: venue?.venue_name?.trim() || 'Bar sem nome',
    existingReview: mapVenueReview((reviewData ?? null) as VenueReviewRow | null),
    opportunity,
    reviewActionLabel: 'Salvar avaliacao do Bar',
    reviewHeadline: 'Avalie como foi tocar nesta casa depois da conclusao do evento.',
    reviewerCity: buildCityStateLabel(artist?.city, artist?.state),
    reviewerName: artist?.stage_name?.trim() || 'Musico verificado',
  };
}

async function fetchBarCompletedContractReview(
  contractId: string,
): Promise<CompletedContractReviewData> {
  const { contract, userId } = await fetchCompletedContractForRole(contractId, 'bar');
  const opportunity = await fetchOpportunityReviewContext(contract.opportunity_id);

  const [
    { data: venueData, error: venueError },
    { data: artistData, error: artistError },
    { data: reviewData, error: reviewError },
    { data: artistMedia, error: artistMediaError },
  ] = await Promise.all([
    supabase
      .from('venue_profiles')
      .select('account_id, venue_name, city, state')
      .eq('account_id', userId)
      .maybeSingle(),
    supabase
      .from('artist_profiles')
      .select('account_id, stage_name, city, state')
      .eq('account_id', contract.artist_id)
      .maybeSingle(),
    supabase
      .from('artist_reviews')
      .select(
        'id, artist_id, opportunity_id, author_venue_id, reviewer_name, reviewer_city, rating, punctuality_rating, quality_rating, professionalism_rating, comment, created_at, updated_at',
      )
      .eq('artist_id', contract.artist_id)
      .eq('opportunity_id', contract.opportunity_id)
      .eq('author_venue_id', userId)
      .maybeSingle(),
    supabase
      .from('artist_media_assets')
      .select('public_url')
      .eq('artist_id', contract.artist_id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  if (venueError) {
    throw toError(venueError, 'Nao foi possivel carregar os dados do Bar para avaliacao.');
  }

  if (artistError) {
    throw toError(artistError, 'Nao foi possivel carregar os dados do Musico para avaliacao.');
  }

  if (reviewError) {
    throw toError(reviewError, 'Nao foi possivel carregar sua avaliacao anterior do Musico.');
  }

  if (artistMediaError) {
    throw toError(artistMediaError, 'Nao foi possivel carregar a capa do Musico para avaliacao.');
  }

  const venue = venueData as VenueProfileReviewRow | null;
  const artist = artistData as ArtistProfileReviewRow | null;

  return {
    accountType: 'bar',
    contract,
    counterpartId: contract.artist_id,
    counterpartImageUrl:
      (artistMedia as { public_url: string } | null)?.public_url ?? null,
    counterpartMeta: buildCityStateLabel(artist?.city, artist?.state),
    counterpartName: artist?.stage_name?.trim() || 'Musico sem nome',
    existingReview: mapArtistReview((reviewData ?? null) as ArtistReviewRow | null),
    opportunity,
    reviewActionLabel: 'Salvar avaliacao do Musico',
    reviewHeadline: 'Registre como foi contratar este artista depois que o show foi concluido.',
    reviewerCity: buildCityStateLabel(venue?.city, venue?.state),
    reviewerName: venue?.venue_name?.trim() || 'Bar verificado',
  };
}

function validateRatingValue(value: number) {
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new Error(
      'Selecione uma nota de 1 a 5 para pontualidade, qualidade e profissionalismo.',
    );
  }

  return value;
}

function calculateCompositeRating(
  punctualityRating: number,
  qualityRating: number,
  professionalismRating: number,
) {
  return Number(((punctualityRating + qualityRating + professionalismRating) / 3).toFixed(1));
}

function validateComment(value: string) {
  const trimmed = value.trim();

  if (trimmed.length < 12) {
    throw new Error(
      'Escreva um comentario com pelo menos 12 caracteres para registrar a avaliacao.',
    );
  }

  return trimmed;
}

async function saveMusicianVenueReview(input: SaveCompletedReviewInput) {
  const context = await fetchMusicianCompletedContractReview(input.contractId);
  const payload = {
    author_artist_id: context.contract.artist_id,
    comment: validateComment(input.comment),
    opportunity_id: context.opportunity.id,
    professionalism_rating: validateRatingValue(input.professionalismRating),
    punctuality_rating: validateRatingValue(input.punctualityRating),
    quality_rating: validateRatingValue(input.qualityRating),
    reviewer_city: context.reviewerCity,
    reviewer_name: context.reviewerName,
    venue_id: context.counterpartId,
  };
  const compositeRating = calculateCompositeRating(
    payload.punctuality_rating,
    payload.quality_rating,
    payload.professionalism_rating,
  );

  if (context.existingReview) {
    const { error } = await supabase
      .from('venue_reviews')
      .update(payload)
      .eq('id', context.existingReview.id);

    if (error) {
      throw toError(error, 'Nao foi possivel atualizar sua avaliacao do Bar.');
    }

    reportTelemetryEvent({
      accountId: context.contract.artist_id,
      accountType: 'musician',
      contractId: context.contract.id,
      context: {
        rating: compositeRating,
        target: 'venue',
        wasUpdate: true,
      },
      eventName: 'review_submitted',
      opportunityId: context.opportunity.id,
      pathname: '/musician/agenda',
    });
    return;
  }

  const { error } = await supabase.from('venue_reviews').insert(payload);

  if (error) {
    throw toError(error, 'Nao foi possivel salvar sua avaliacao do Bar.');
  }

  reportTelemetryEvent({
    accountId: context.contract.artist_id,
    accountType: 'musician',
    contractId: context.contract.id,
    context: {
      rating: compositeRating,
      target: 'venue',
      wasUpdate: false,
    },
    eventName: 'review_submitted',
    opportunityId: context.opportunity.id,
    pathname: '/musician/agenda',
  });
}

async function saveBarArtistReview(input: SaveCompletedReviewInput) {
  const context = await fetchBarCompletedContractReview(input.contractId);
  const payload = {
    artist_id: context.counterpartId,
    author_venue_id: context.contract.venue_id,
    comment: validateComment(input.comment),
    opportunity_id: context.opportunity.id,
    professionalism_rating: validateRatingValue(input.professionalismRating),
    punctuality_rating: validateRatingValue(input.punctualityRating),
    quality_rating: validateRatingValue(input.qualityRating),
    reviewer_city: context.reviewerCity,
    reviewer_name: context.reviewerName,
  };
  const compositeRating = calculateCompositeRating(
    payload.punctuality_rating,
    payload.quality_rating,
    payload.professionalism_rating,
  );

  if (context.existingReview) {
    const { error } = await supabase
      .from('artist_reviews')
      .update(payload)
      .eq('id', context.existingReview.id);

    if (error) {
      throw toError(error, 'Nao foi possivel atualizar sua avaliacao do Musico.');
    }

    reportTelemetryEvent({
      accountId: context.contract.venue_id,
      accountType: 'bar',
      contractId: context.contract.id,
      context: {
        rating: compositeRating,
        target: 'artist',
        wasUpdate: true,
      },
      eventName: 'review_submitted',
      opportunityId: context.opportunity.id,
      pathname: '/bar/agenda',
    });
    return;
  }

  const { error } = await supabase.from('artist_reviews').insert(payload);

  if (error) {
    throw toError(error, 'Nao foi possivel salvar sua avaliacao do Musico.');
  }

  reportTelemetryEvent({
    accountId: context.contract.venue_id,
    accountType: 'bar',
    contractId: context.contract.id,
    context: {
      rating: compositeRating,
      target: 'artist',
      wasUpdate: false,
    },
    eventName: 'review_submitted',
    opportunityId: context.opportunity.id,
    pathname: '/bar/agenda',
  });
}

export function formatCompletedContractReviewSchedule(context: CompletedContractReviewData) {
  return formatContractAgendaScheduleLabel(context.opportunity);
}

export function useCompletedContractReview(accountType: AccountType, contractId?: string) {
  return useQuery({
    enabled: Boolean(contractId),
    queryFn: () =>
      accountType === 'musician'
        ? fetchMusicianCompletedContractReview(contractId as string)
        : fetchBarCompletedContractReview(contractId as string),
    queryKey: ['reviews', accountType, contractId ?? 'missing'],
  });
}

export function useSaveCompletedContractReview(accountType: AccountType) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['reviews', accountType, 'save'],
    mutationFn: (input: SaveCompletedReviewInput) =>
      accountType === 'musician' ? saveMusicianVenueReview(input) : saveBarArtistReview(input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['reviews'] }),
        queryClient.invalidateQueries({ queryKey: ['reputation'] }),
        queryClient.invalidateQueries({ queryKey: ['contracts'] }),
        queryClient.invalidateQueries({ queryKey: ['opportunities'] }),
        queryClient.invalidateQueries({ queryKey: ['search', 'bar'] }),
      ]);
    },
  });
}
