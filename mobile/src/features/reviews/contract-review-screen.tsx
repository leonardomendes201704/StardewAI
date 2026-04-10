import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  formatCompletedContractReviewSchedule,
  useCompletedContractReview,
  useSaveCompletedContractReview,
} from '@/src/features/reviews/reviews';
import { type AccountType } from '@/src/features/session/account';
import {
  Avatar,
  BottomNav,
  GhostButton,
  GlassCard,
  GlowButton,
  InputField,
  TopBar,
  getBottomNavStickyActionOffset,
} from '@/src/shared/components';
import { colors, radii, spacing, typography } from '@/src/shared/theme';

type ReviewFormState = {
  comment: string;
  professionalismRating: number;
  punctualityRating: number;
  qualityRating: number;
};

const emptyFormState: ReviewFormState = {
  comment: '',
  professionalismRating: 0,
  punctualityRating: 0,
  qualityRating: 0,
};

type PersistedReviewState = {
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

export function ContractReviewScreen({
  accountType,
  contractId,
}: {
  accountType: AccountType;
  contractId?: string;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const stickyActionBottom = getBottomNavStickyActionOffset(insets.bottom);
  const reviewQuery = useCompletedContractReview(accountType, contractId);
  const saveReviewMutation = useSaveCompletedContractReview(accountType);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [form, setForm] = useState<ReviewFormState>(emptyFormState);
  const [submittedReview, setSubmittedReview] = useState<PersistedReviewState | null>(null);
  const title = accountType === 'musician' ? 'Avaliar Bar' : 'Avaliar Musico';

  useEffect(() => {
    if (!reviewQuery.data) {
      return;
    }

    setForm({
      comment: reviewQuery.data.existingReview?.comment ?? '',
      professionalismRating: reviewQuery.data.existingReview?.professionalismRating ?? 0,
      punctualityRating: reviewQuery.data.existingReview?.punctualityRating ?? 0,
      qualityRating: reviewQuery.data.existingReview?.qualityRating ?? 0,
    });
  }, [reviewQuery.data]);

  async function handleSaveReview() {
    if (!contractId) {
      return;
    }

    setErrorMessage(null);
    setFeedback(null);

    try {
      await saveReviewMutation.mutateAsync({
        comment: form.comment,
        contractId,
        professionalismRating: form.professionalismRating,
        punctualityRating: form.punctualityRating,
        qualityRating: form.qualityRating,
      });
      setFeedback(
        reviewQuery.data?.existingReview
          ? 'Avaliacao atualizada. A reputacao publica foi recalculada.'
          : 'Avaliacao salva. A reputacao publica foi recalculada.',
      );
      setSubmittedReview({
        comment: form.comment.trim(),
        createdAt: reviewQuery.data?.existingReview?.createdAt ?? new Date().toISOString(),
        id: reviewQuery.data?.existingReview?.id ?? `submitted-${contractId}`,
        professionalismRating: form.professionalismRating,
        punctualityRating: form.punctualityRating,
        qualityRating: form.qualityRating,
        rating: calculateCompositeReviewRating(form),
        reviewerCity: reviewQuery.data?.reviewerCity ?? null,
        reviewerName: reviewQuery.data?.reviewerName ?? 'Usuario verificado',
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Nao foi possivel salvar esta avaliacao.',
      );
    }
  }

  if (!contractId) {
    return (
      <SafeAreaView edges={['left', 'right']} style={styles.screen}>
        <TopBar leftIcon="arrow-back" onLeftPress={() => router.back()} title={title} />
        <View style={styles.body}>
          <View style={styles.contentWrap}>
            <GlassCard padding={spacing.xl} surface="panel">
              <Text style={styles.sectionEyebrow}>Avaliacao indisponivel</Text>
              <Text style={styles.sectionTitle}>Nao foi possivel identificar este contrato.</Text>
              <Text style={styles.sectionCopy}>
                Volte para a agenda e abra novamente o show concluido que deseja avaliar.
              </Text>
            </GlassCard>
          </View>
          <BottomNav accountType={accountType} active="calendar" />
        </View>
      </SafeAreaView>
    );
  }

  const canSubmit =
    form.punctualityRating > 0 &&
    form.qualityRating > 0 &&
    form.professionalismRating > 0 &&
    form.comment.trim().length >= 12;
  const resolvedReview = submittedReview ?? reviewQuery.data?.existingReview ?? null;
  const hasCompletedReview = Boolean(resolvedReview);

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.screen}>
      <TopBar leftIcon="arrow-back" onLeftPress={() => router.back()} title={title} />

      <View style={styles.body}>
        {reviewQuery.isLoading && !reviewQuery.data ? (
          <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: stickyActionBottom + 120 }]}>
            <GlassCard padding={spacing.xl} surface="panel">
              <View style={styles.loadingHero} />
              <View style={styles.loadingBlock} />
              <View style={[styles.loadingBlock, styles.loadingWide]} />
            </GlassCard>
            <LoadingSection />
            <LoadingSection />
          </ScrollView>
        ) : reviewQuery.isError || !reviewQuery.data ? (
          <View style={styles.contentWrap}>
            <GlassCard padding={spacing.xl} surface="panel">
              <Text style={styles.sectionEyebrow}>Erro</Text>
              <Text style={styles.sectionTitle}>Nao foi possivel abrir esta avaliacao.</Text>
              <Text style={styles.sectionCopy}>
                {reviewQuery.error instanceof Error
                  ? reviewQuery.error.message
                  : 'Tente voltar para a agenda e abrir o show novamente.'}
              </Text>
              <GhostButton label="Voltar para a agenda" onPress={() => router.back()} />
            </GlassCard>
          </View>
        ) : (
          <>
            <ScrollView
              contentContainerStyle={[
                styles.content,
                { paddingBottom: hasCompletedReview ? 132 : stickyActionBottom + 128 },
              ]}
              showsVerticalScrollIndicator={false}>
              <GlassCard padding={spacing.xl} style={styles.heroCard} surface="panel">
                <View style={styles.heroTop}>
                  <Avatar
                    icon={accountType === 'musician' ? 'storefront' : 'music-note'}
                    image={reviewQuery.data.counterpartImageUrl ?? undefined}
                    size={72}
                  />
                  <View style={styles.heroCopy}>
                    <Text style={styles.sectionEyebrow}>Pos-evento</Text>
                    <Text style={styles.heroTitle}>{reviewQuery.data.counterpartName}</Text>
                    {reviewQuery.data.counterpartMeta ? (
                      <Text style={styles.heroMeta}>{reviewQuery.data.counterpartMeta}</Text>
                    ) : null}
                  </View>
                </View>
                <Text style={styles.sectionCopy}>{reviewQuery.data.reviewHeadline}</Text>
                <View style={styles.summaryBlock}>
                  <Text style={styles.summaryTitle}>{reviewQuery.data.opportunity.title}</Text>
                  <Text style={styles.summaryMeta}>
                    {formatCompletedContractReviewSchedule(reviewQuery.data)}
                  </Text>
                  <Text style={styles.summaryMeta}>{reviewQuery.data.opportunity.location_label}</Text>
                </View>
                {resolvedReview ? (
                  <Text style={styles.editHint}>
                    {feedback ?? 'Este evento ja foi avaliado com sucesso.'}
                  </Text>
                ) : null}
              </GlassCard>

              {resolvedReview ? (
                <GlassCard padding={spacing.xl} surface="panel">
                  <Text style={styles.sectionEyebrow}>Avaliacao registrada</Text>
                  <Text style={styles.sectionTitle}>Score publico atualizado</Text>
                  <View style={styles.reviewResultHero}>
                    <Text style={styles.reviewAverageValue}>{resolvedReview.rating.toFixed(1)}</Text>
                    <View style={styles.reviewResultCopy}>
                      <StarRating rating={resolvedReview.rating} />
                      <Text style={styles.summaryMeta}>
                        A reputacao deste perfil ja foi recalculada com sua avaliacao.
                      </Text>
                    </View>
                  </View>
                  <View style={styles.reviewBreakdown}>
                    <ReviewMetric
                      label="Pontualidade"
                      value={resolvedReview.punctualityRating}
                    />
                    <ReviewMetric label="Qualidade" value={resolvedReview.qualityRating} />
                    <ReviewMetric
                      label="Profissionalismo"
                      value={resolvedReview.professionalismRating}
                    />
                  </View>
                  <View style={styles.savedCommentBlock}>
                    <Text style={styles.savedCommentLabel}>Seu depoimento</Text>
                    <Text style={styles.savedCommentText}>{resolvedReview.comment}</Text>
                    <Text style={styles.savedCommentMeta}>
                      Avaliacao registrada em{' '}
                      {new Date(resolvedReview.updatedAt).toLocaleString('pt-BR')}
                    </Text>
                  </View>
                </GlassCard>
              ) : (
                <>
                  <GlassCard padding={spacing.xl} surface="panel">
                    <Text style={styles.sectionEyebrow}>Score detalhado</Text>
                    <Text style={styles.sectionTitle}>
                      Diga como foi a experiencia em tres frentes.
                    </Text>
                    <RatingField
                      description="Chegou, preparou e operou no tempo combinado."
                      label="Pontualidade"
                      onChange={(value) =>
                        setForm((current) => ({ ...current, punctualityRating: value }))
                      }
                      value={form.punctualityRating}
                    />
                    <RatingField
                      description="Entrega artistica, repertorio e resultado do show."
                      label="Qualidade"
                      onChange={(value) =>
                        setForm((current) => ({ ...current, qualityRating: value }))
                      }
                      value={form.qualityRating}
                    />
                    <RatingField
                      description="Postura, comunicacao e trato com equipe e contratante."
                      label="Profissionalismo"
                      onChange={(value) =>
                        setForm((current) => ({ ...current, professionalismRating: value }))
                      }
                      value={form.professionalismRating}
                    />
                  </GlassCard>

                  <GlassCard padding={spacing.xl} surface="panel">
                    <Text style={styles.sectionEyebrow}>Depoimento</Text>
                    <Text style={styles.sectionTitle}>
                      Escreva um comentario objetivo para a reputacao publica.
                    </Text>
                    <InputField
                      icon="rate-review"
                      multiline
                      onChangeText={(value) =>
                        setForm((current) => ({ ...current, comment: value }))
                      }
                      placeholder={
                        accountType === 'musician'
                          ? 'Como foi tocar neste Bar? Estrutura, comunicacao, recepcao e pagamento.'
                          : 'Como foi contratar este Musico? Presenca, repertorio, pontualidade e postura.'
                      }
                      value={form.comment}
                    />
                    <Text style={styles.helperText}>
                      Minimo de 12 caracteres. Este texto aparecera na reputacao publica.
                    </Text>
                  </GlassCard>
                </>
              )}

              {(errorMessage || (feedback && !resolvedReview)) && (
                <GlassCard padding={spacing.lg} style={styles.feedbackCard} surface="panel">
                  {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
                  {feedback && !resolvedReview ? (
                    <Text style={styles.feedbackText}>{feedback}</Text>
                  ) : null}
                </GlassCard>
              )}
            </ScrollView>

            {!hasCompletedReview ? (
              <View style={[styles.stickyAction, { bottom: stickyActionBottom }]}>
                <GlowButton
                  containerStyle={styles.primaryAction}
                  disabled={!canSubmit || saveReviewMutation.isPending}
                  icon="task-alt"
                  label={
                    saveReviewMutation.isPending
                      ? 'Salvando avaliacao'
                      : reviewQuery.data.reviewActionLabel
                  }
                  onPress={() => void handleSaveReview()}
                />
              </View>
            ) : null}
          </>
        )}

        <BottomNav accountType={accountType} active="calendar" />
      </View>
    </SafeAreaView>
  );
}

function RatingField({
  description,
  label,
  onChange,
  value,
}: {
  description: string;
  label: string;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <View style={styles.ratingField}>
      <View style={styles.ratingCopy}>
        <Text style={styles.ratingLabel}>{label}</Text>
        <Text style={styles.ratingDescription}>{description}</Text>
      </View>
      <View style={styles.ratingStars}>
        {Array.from({ length: 5 }, (_, index) => {
          const starValue = index + 1;
          const isActive = value >= starValue;

          return (
            <Pressable
              key={`${label}-${starValue}`}
              onPress={() => onChange(starValue)}
              style={({ pressed }) => [styles.starButton, pressed && styles.pressedStar]}>
              <MaterialIcons
                color={isActive ? colors.primary : colors.outline}
                name={isActive ? 'star' : 'star-border'}
                size={26}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function LoadingSection() {
  return (
    <GlassCard padding={spacing.xl} surface="panel">
      <View style={styles.loadingBlock} />
      <View style={[styles.loadingBlock, styles.loadingWide]} />
      <View style={[styles.loadingBlock, styles.loadingShort]} />
    </GlassCard>
  );
}

function ReviewMetric({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value.toFixed(1)}</Text>
    </View>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <View style={styles.ratingStars}>
      {Array.from({ length: 5 }, (_, index) => {
        const starValue = index + 1;
        const isActive = rating >= starValue;

        return (
          <MaterialIcons
            key={`saved-star-${starValue}`}
            color={isActive ? colors.primary : colors.outline}
            name={isActive ? 'star' : 'star-border'}
            size={22}
          />
        );
      })}
    </View>
  );
}

function calculateCompositeReviewRating(form: ReviewFormState) {
  return Math.max(
    1,
    Math.min(
      5,
      Math.round(
        (form.punctualityRating + form.qualityRating + form.professionalismRating) / 3,
      ),
    ),
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  body: {
    flex: 1,
    position: 'relative',
  },
  contentWrap: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  content: {
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  heroCard: {
    gap: spacing.lg,
  },
  heroTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  heroCopy: {
    flex: 1,
    gap: 4,
  },
  heroTitle: {
    ...typography.sectionTitle,
    color: colors.onSurface,
  },
  heroMeta: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
  },
  sectionEyebrow: {
    ...typography.label,
    color: colors.secondary,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.onSurface,
  },
  sectionCopy: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
  },
  summaryBlock: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.lg,
    gap: 4,
    padding: spacing.md,
  },
  summaryTitle: {
    ...typography.cardTitle,
    color: colors.onSurface,
  },
  summaryMeta: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
  },
  editHint: {
    ...typography.bodyMedium,
    color: colors.primary,
  },
  reviewResultHero: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  reviewAverageValue: {
    ...typography.display,
    color: colors.primary,
  },
  reviewResultCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  reviewBreakdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metricCard: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.lg,
    minWidth: '30%',
    padding: spacing.md,
  },
  metricLabel: {
    ...typography.label,
    color: colors.onSurfaceVariant,
  },
  metricValue: {
    ...typography.bodyBold,
    color: colors.primary,
    marginTop: 6,
  },
  savedCommentBlock: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.lg,
    gap: spacing.xs,
    padding: spacing.md,
  },
  savedCommentLabel: {
    ...typography.label,
    color: colors.secondary,
  },
  savedCommentText: {
    ...typography.body,
    color: colors.onSurface,
  },
  savedCommentMeta: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
  },
  ratingField: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.lg,
    gap: spacing.sm,
    padding: spacing.md,
  },
  ratingCopy: {
    gap: 4,
  },
  ratingLabel: {
    ...typography.bodyBold,
    color: colors.onSurface,
  },
  ratingDescription: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  starButton: {
    borderRadius: radii.pill,
    padding: 4,
  },
  pressedStar: {
    backgroundColor: 'rgba(243,255,202,0.08)',
  },
  helperText: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
  },
  feedbackCard: {
    marginBottom: spacing.xs,
  },
  errorText: {
    ...typography.bodyMedium,
    color: '#ff9da7',
  },
  feedbackText: {
    ...typography.bodyMedium,
    color: colors.primary,
  },
  stickyAction: {
    left: spacing.lg,
    position: 'absolute',
    right: spacing.lg,
  },
  primaryAction: {
    width: '100%',
  },
  loadingHero: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radii.lg,
    height: 72,
    width: 72,
  },
  loadingBlock: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radii.pill,
    height: 18,
    width: '54%',
  },
  loadingWide: {
    width: '88%',
  },
  loadingShort: {
    width: '34%',
  },
});
