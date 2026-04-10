import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/src/shared/components';
import { supabase } from '@/src/shared/api/supabase/client';
import { colors, radii, spacing, typography } from '@/src/shared/theme';

type ReputationReviewRow = {
  comment: string;
  created_at: string;
  id: string;
  professionalism_rating: number;
  punctuality_rating: number;
  quality_rating: number;
  rating: number;
  reviewer_city: string | null;
  reviewer_name: string;
};

export type ProfileReviewRecord = {
  comment: string;
  createdAt: string;
  id: string;
  professionalismRating: number;
  punctualityRating: number;
  qualityRating: number;
  rating: number;
  reviewerCity: string | null;
  reviewerName: string;
};

export type ReputationDistributionBucket = {
  count: number;
  percentage: number;
  stars: number;
};

export type ProfileReputationSummary = {
  averageRating: number | null;
  completedContracts: number;
  distribution: ReputationDistributionBucket[];
  latestReviews: ProfileReviewRecord[];
  totalReviews: number;
};

export type ProfileTrustSignal = {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  tone: 'muted' | 'primary' | 'secondary';
};

type ProfileReputationCardProps = {
  emptyCopy: string;
  errorMessage?: string | null;
  eyebrow: string;
  loading?: boolean;
  summary: ProfileReputationSummary | null | undefined;
  title: string;
};

type ProfileTrustSignalsCardProps = {
  eyebrow: string;
  signals: ProfileTrustSignal[];
  title: string;
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
    throw new Error('Sessao expirada. Entre novamente para carregar a reputacao.');
  }

  return user.id;
}

function mapReviewRow(row: ReputationReviewRow): ProfileReviewRecord {
  return {
    comment: row.comment.trim(),
    createdAt: row.created_at,
    id: row.id,
    professionalismRating: row.professionalism_rating,
    punctualityRating: row.punctuality_rating,
    qualityRating: row.quality_rating,
    rating: row.rating,
    reviewerCity: sanitizeText(row.reviewer_city),
    reviewerName: row.reviewer_name.trim(),
  };
}

function buildProfileReputationSummary(
  rows: ReputationReviewRow[],
  completedContracts: number,
): ProfileReputationSummary {
  const reviews = rows.map(mapReviewRow);
  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? Number(
          (
            reviews.reduce((total, review) => total + review.rating, 0) / totalReviews
          ).toFixed(1),
        )
      : null;
  const distribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((review) => Math.round(review.rating) === stars).length;

    return {
      count,
      percentage: totalReviews > 0 ? count / totalReviews : 0,
      stars,
    } satisfies ReputationDistributionBucket;
  });

  return {
    averageRating,
    completedContracts,
    distribution,
    latestReviews: reviews.slice(0, 5),
    totalReviews,
  };
}

async function fetchVenueProfileReputation(): Promise<ProfileReputationSummary> {
  const userId = await requireAuthenticatedUserId();
  const [{ data: reviews, error: reviewsError }, { count, error: contractsError }] =
    await Promise.all([
      supabase
        .from('venue_reviews')
        .select(
          'id, reviewer_name, reviewer_city, rating, punctuality_rating, quality_rating, professionalism_rating, comment, created_at',
        )
        .eq('venue_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('contracts')
        .select('id', { count: 'exact', head: true })
        .eq('venue_id', userId)
        .eq('status', 'completed'),
    ]);

  if (reviewsError) {
    throw reviewsError;
  }

  if (contractsError) {
    throw contractsError;
  }

  return buildProfileReputationSummary(
    ((reviews ?? []) as ReputationReviewRow[]),
    count ?? 0,
  );
}

async function fetchArtistProfileReputation(): Promise<ProfileReputationSummary> {
  const userId = await requireAuthenticatedUserId();
  const [{ data: reviews, error: reviewsError }, { count, error: contractsError }] =
    await Promise.all([
      supabase
        .from('artist_reviews')
        .select(
          'id, reviewer_name, reviewer_city, rating, punctuality_rating, quality_rating, professionalism_rating, comment, created_at',
        )
        .eq('artist_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('contracts')
        .select('id', { count: 'exact', head: true })
        .eq('artist_id', userId)
        .eq('status', 'completed'),
    ]);

  if (reviewsError) {
    throw reviewsError;
  }

  if (contractsError) {
    throw contractsError;
  }

  return buildProfileReputationSummary(
    ((reviews ?? []) as ReputationReviewRow[]),
    count ?? 0,
  );
}

function sanitizeText(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function useVenueProfileReputation() {
  return useQuery({
    queryFn: fetchVenueProfileReputation,
    queryKey: ['reputation', 'bar', 'profile'],
  });
}

export function useArtistProfileReputation() {
  return useQuery({
    queryFn: fetchArtistProfileReputation,
    queryKey: ['reputation', 'musician', 'profile'],
  });
}

export function buildBarTrustSignals(input: {
  city: string;
  completedContracts: number;
  mediaCount: number;
  postalCode: string;
  profileCompleted: boolean;
  state: string;
  street: string;
  totalReviews: number;
}) {
  const hasValidatedAddress = Boolean(
    input.postalCode.trim() && input.street.trim() && input.city.trim() && input.state.trim(),
  );

  return [
    {
      icon: input.profileCompleted ? 'verified' : 'edit-note',
      label: input.profileCompleted ? 'Perfil completo' : 'Perfil em rascunho',
      tone: input.profileCompleted ? 'primary' : 'muted',
    },
    {
      icon: hasValidatedAddress ? 'place' : 'markunread-mailbox',
      label: hasValidatedAddress ? 'Endereco validado por CEP' : 'Endereco pendente',
      tone: hasValidatedAddress ? 'secondary' : 'muted',
    },
    {
      icon: input.mediaCount > 0 ? 'photo-library' : 'add-photo-alternate',
      label:
        input.mediaCount > 0
          ? `${input.mediaCount} fotos do ambiente`
          : 'Fotos do ambiente pendentes',
      tone: input.mediaCount > 0 ? 'primary' : 'muted',
    },
    {
      icon: input.totalReviews > 0 ? 'star' : 'event-available',
      label:
        input.totalReviews > 0
          ? `${input.totalReviews} avaliacoes publicas`
          : input.completedContracts > 0
            ? `${input.completedContracts} shows concluidos`
            : 'Sem historico publico ainda',
      tone: input.totalReviews > 0 ? 'secondary' : input.completedContracts > 0 ? 'primary' : 'muted',
    },
  ] satisfies ProfileTrustSignal[];
}

export function buildMusicianTrustSignals(input: {
  city: string;
  completedContracts: number;
  genreCount: number;
  mediaCount: number;
  postalCode: string;
  profileCompleted: boolean;
  state: string;
  totalReviews: number;
}) {
  const hasValidatedBase = Boolean(
    input.postalCode.trim() && input.city.trim() && input.state.trim(),
  );

  return [
    {
      icon: input.profileCompleted ? 'verified' : 'edit-note',
      label: input.profileCompleted ? 'Perfil completo' : 'Perfil em rascunho',
      tone: input.profileCompleted ? 'primary' : 'muted',
    },
    {
      icon: hasValidatedBase ? 'home-work' : 'markunread-mailbox',
      label: hasValidatedBase ? 'Base validada por CEP' : 'Base geografica pendente',
      tone: hasValidatedBase ? 'secondary' : 'muted',
    },
    {
      icon: input.mediaCount > 0 ? 'perm-media' : 'add-photo-alternate',
      label:
        input.mediaCount > 0
          ? `${input.mediaCount} fotos no portfolio`
          : 'Portfolio visual pendente',
      tone: input.mediaCount > 0 ? 'primary' : 'muted',
    },
    {
      icon: input.totalReviews > 0 ? 'star' : input.genreCount > 0 ? 'music-note' : 'event-available',
      label:
        input.totalReviews > 0
          ? `${input.totalReviews} avaliacoes publicas`
          : input.completedContracts > 0
            ? `${input.completedContracts} shows concluidos`
            : input.genreCount > 0
              ? `${input.genreCount} estilos publicados`
              : 'Sem historico publico ainda',
      tone:
        input.totalReviews > 0
          ? 'secondary'
          : input.completedContracts > 0 || input.genreCount > 0
            ? 'primary'
            : 'muted',
    },
  ] satisfies ProfileTrustSignal[];
}

export function buildPublicBarTrustSignals(input: {
  hasAddressContext: boolean;
  hasOperationalProfile: boolean;
  mediaCount: number;
  totalReviews: number;
}) {
  return [
    {
      icon: input.hasOperationalProfile ? 'verified' : 'edit-note',
      label: input.hasOperationalProfile ? 'Perfil operacional claro' : 'Perfil com dados parciais',
      tone: input.hasOperationalProfile ? 'primary' : 'muted',
    },
    {
      icon: input.hasAddressContext ? 'place' : 'map',
      label: input.hasAddressContext ? 'Endereco publicado' : 'Endereco publico parcial',
      tone: input.hasAddressContext ? 'secondary' : 'muted',
    },
    {
      icon: input.mediaCount > 0 ? 'photo-library' : 'add-photo-alternate',
      label: input.mediaCount > 0 ? 'Fotos reais da casa' : 'Sem fotos da casa',
      tone: input.mediaCount > 0 ? 'primary' : 'muted',
    },
    {
      icon: input.totalReviews > 0 ? 'star' : 'history',
      label:
        input.totalReviews > 0
          ? `${input.totalReviews} avaliacoes de musicos`
          : 'Sem reviews publicas ainda',
      tone: input.totalReviews > 0 ? 'secondary' : 'muted',
    },
  ] satisfies ProfileTrustSignal[];
}

export function buildPublicMusicianTrustSignals(input: {
  genreCount: number;
  hasBaseContext: boolean;
  hasCommercialProfile: boolean;
  mediaCount: number;
  totalReviews: number;
}) {
  return [
    {
      icon: input.hasCommercialProfile ? 'verified' : 'edit-note',
      label: input.hasCommercialProfile ? 'Perfil comercial claro' : 'Perfil com dados parciais',
      tone: input.hasCommercialProfile ? 'primary' : 'muted',
    },
    {
      icon: input.hasBaseContext ? 'near-me' : 'map',
      label: input.hasBaseContext ? 'Base de atuacao publicada' : 'Base geografica parcial',
      tone: input.hasBaseContext ? 'secondary' : 'muted',
    },
    {
      icon: input.mediaCount > 0 ? 'perm-media' : 'add-photo-alternate',
      label: input.mediaCount > 0 ? 'Portfolio visual publicado' : 'Sem portfolio visual',
      tone: input.mediaCount > 0 ? 'primary' : 'muted',
    },
    {
      icon: input.totalReviews > 0 ? 'star' : input.genreCount > 0 ? 'music-note' : 'history',
      label:
        input.totalReviews > 0
          ? `${input.totalReviews} avaliacoes de bares`
          : input.genreCount > 0
            ? `${input.genreCount} estilos publicados`
            : 'Sem reviews publicas ainda',
      tone: input.totalReviews > 0 ? 'secondary' : input.genreCount > 0 ? 'primary' : 'muted',
    },
  ] satisfies ProfileTrustSignal[];
}

export function ProfileTrustSignalsCard({
  eyebrow,
  signals,
  title,
}: ProfileTrustSignalsCardProps) {
  return (
    <GlassCard padding={spacing.xl} style={styles.sectionCard} surface="panel">
      <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>

      <View style={styles.signalGrid}>
        {signals.map((signal) => (
          <View
            key={`${signal.icon}-${signal.label}`}
            style={[
              styles.signalCard,
              signal.tone === 'primary'
                ? styles.signalCardPrimary
                : signal.tone === 'secondary'
                  ? styles.signalCardSecondary
                  : styles.signalCardMuted,
            ]}>
            <MaterialIcons
              color={
                signal.tone === 'primary'
                  ? colors.primary
                  : signal.tone === 'secondary'
                    ? colors.secondary
                    : colors.onSurfaceVariant
              }
              name={signal.icon}
              size={18}
            />
            <Text style={styles.signalLabel}>{signal.label}</Text>
          </View>
        ))}
      </View>
    </GlassCard>
  );
}

export function ProfileReputationCard({
  emptyCopy,
  errorMessage,
  eyebrow,
  loading = false,
  summary,
  title,
}: ProfileReputationCardProps) {
  return (
    <GlassCard padding={spacing.xl} style={styles.sectionCard} surface="panel">
      <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>

      {loading && !summary ? (
        <Text style={styles.supportCopy}>Carregando reputacao e historico recente...</Text>
      ) : null}

      {!loading && errorMessage ? <Text style={styles.errorCopy}>{errorMessage}</Text> : null}

      {summary ? (
        <>
          <View style={styles.summaryTop}>
            <Text style={styles.averageValue}>
              {summary.averageRating !== null
                ? summary.averageRating.toFixed(1).replace('.', ',')
                : '--'}
            </Text>

            <View style={styles.summaryCopy}>
              <View style={styles.starRow}>
                {Array.from({ length: 5 }, (_, index) => (
                  <MaterialIcons
                    color={
                      summary.averageRating !== null && index < Math.round(summary.averageRating)
                        ? colors.primary
                        : colors.outlineVariant
                    }
                    key={`summary-star-${index + 1}`}
                    name={
                      summary.averageRating !== null && index < Math.round(summary.averageRating)
                        ? 'star'
                        : 'star-border'
                    }
                    size={18}
                  />
                ))}
              </View>

              <Text style={styles.summaryMeta}>
                {summary.totalReviews > 0
                  ? `${summary.totalReviews} avaliacoes publicas`
                  : 'Nenhuma avaliacao publicada ainda'}
              </Text>
              <Text style={styles.supportCopy}>
                {summary.completedContracts > 0
                  ? `${summary.completedContracts} shows concluidos no historico`
                  : 'O historico de shows aparece aqui conforme o uso do marketplace cresce.'}
              </Text>
            </View>
          </View>

          {summary.totalReviews > 0 ? (
            <>
              <View style={styles.distributionList}>
                {summary.distribution.map((bucket) => (
                  <View key={`bucket-${bucket.stars}`} style={styles.distributionRow}>
                    <Text style={styles.distributionLabel}>{bucket.stars} estrelas</Text>
                    <View style={styles.distributionTrack}>
                      <View
                        style={[
                          styles.distributionFill,
                          { width: `${Math.max(bucket.percentage * 100, bucket.count > 0 ? 8 : 0)}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.distributionCount}>{bucket.count}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.reviewList}>
                {summary.latestReviews.map((review) => (
                  <View key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewIdentity}>
                        <Text style={styles.reviewAuthor}>{review.reviewerName}</Text>
                        {review.reviewerCity ? (
                          <Text style={styles.reviewMeta}>{review.reviewerCity}</Text>
                        ) : null}
                      </View>
                      <Text style={styles.reviewRating}>
                        {review.rating.toFixed(1).replace('.', ',')}
                      </Text>
                    </View>
                    <Text style={styles.reviewComment}>{review.comment}</Text>
                    <Text style={styles.reviewMeta}>
                      {formatReviewCriteria(review)} - {formatReviewDate(review.createdAt)}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <Text style={styles.supportCopy}>{emptyCopy}</Text>
          )}
        </>
      ) : null}
    </GlassCard>
  );
}

function formatReviewCriteria(review: ProfileReviewRecord) {
  return `Pontualidade ${review.punctualityRating}/5, qualidade ${review.qualityRating}/5, profissionalismo ${review.professionalismRating}/5`;
}

function formatReviewDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

const styles = StyleSheet.create({
  sectionCard: {
    gap: spacing.md,
  },
  sectionEyebrow: {
    ...typography.label,
    color: colors.secondary,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.onSurface,
  },
  signalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  signalCard: {
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.xs,
    minHeight: 72,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    width: '48%',
  },
  signalCardPrimary: {
    backgroundColor: 'rgba(243,255,202,0.08)',
    borderColor: 'rgba(243,255,202,0.18)',
  },
  signalCardSecondary: {
    backgroundColor: 'rgba(0,238,252,0.08)',
    borderColor: 'rgba(0,238,252,0.16)',
  },
  signalCardMuted: {
    backgroundColor: colors.surfaceContainerHigh,
    borderColor: colors.borderGhost,
  },
  signalLabel: {
    ...typography.bodyMedium,
    color: colors.onSurface,
  },
  summaryTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.lg,
  },
  averageValue: {
    ...typography.screenTitle,
    color: colors.primary,
    fontSize: 42,
    lineHeight: 46,
  },
  summaryCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  summaryMeta: {
    ...typography.bodyBold,
    color: colors.onSurface,
  },
  supportCopy: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
  },
  errorCopy: {
    ...typography.bodyMedium,
    color: '#ffb2b9',
  },
  starRow: {
    flexDirection: 'row',
    gap: 2,
  },
  distributionList: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  distributionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  distributionLabel: {
    ...typography.label,
    color: colors.onSurfaceVariant,
    width: 70,
  },
  distributionTrack: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.pill,
    flex: 1,
    height: 10,
    overflow: 'hidden',
  },
  distributionFill: {
    backgroundColor: colors.primaryContainer,
    borderRadius: radii.pill,
    height: '100%',
  },
  distributionCount: {
    ...typography.bodyBold,
    color: colors.onSurface,
    textAlign: 'right',
    width: 22,
  },
  reviewList: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  reviewCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.borderGhost,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  reviewHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  reviewIdentity: {
    flex: 1,
    gap: 2,
  },
  reviewAuthor: {
    ...typography.bodyBold,
    color: colors.onSurface,
  },
  reviewRating: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  reviewComment: {
    ...typography.body,
    color: colors.onSurface,
  },
  reviewMeta: {
    ...typography.label,
    color: colors.onSurfaceVariant,
  },
});
