import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  formatContractStatusLabel,
  getContractTone,
} from '@/src/features/contracts/contracts';
import { useBarOpportunityCandidates } from '@/src/features/opportunities/bar-candidates';
import {
  formatOpportunityBudget,
  formatOpportunityScheduleLabel,
} from '@/src/features/opportunities/opportunities';
import {
  BottomNav,
  Chip,
  EmptyState,
  GhostButton,
  GlassCard,
  ImageUri,
  TopBar,
} from '@/src/shared/components';
import { colors, radii, spacing, typography } from '@/src/shared/theme';

const defaultArtistImage =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCrt1x9MZ1YV-DOzUUTG9KuJgd7GOkSWSdo8aLxGeNdkKKBVX9agul9JOWv2lyEEBHZR_iqysSY0CCS4acK0sg1yRpUYrcZYrBbhAcbTY63lGvuzyG6oiYZf503WKqF4fVAIAaHXjR1zxps2keXJcWzAs3ZI7avUQOkhELUjUd29OPwFNObgoj4pMTMMVzR4J6eRH2Jxt3bd8CHLmiLsArY8rCjVX6rG_jCvdOwv6S42wNB0bv1FhPvEuAfVCVefpuxPDBodSKxpRxG';

export function BarOpportunityCandidatesScreen({ opportunityId }: { opportunityId?: string }) {
  const router = useRouter();
  const candidatesQuery = useBarOpportunityCandidates(opportunityId);

  if (!opportunityId) {
    return (
      <SafeAreaView edges={['left', 'right']} style={styles.screen}>
        <TopBar leftIcon="arrow-back" onLeftPress={() => router.back()} title="Candidatos" />
        <View style={styles.body}>
          <View style={styles.contentWrap}>
            <EmptyState
              description="Volte para a home do Bar e abra novamente a vaga correta."
              eyebrow="Marketplace"
              title="Vaga nao identificada"
            />
          </View>
          <BottomNav accountType="bar" active="home" />
        </View>
      </SafeAreaView>
    );
  }

  if (candidatesQuery.isLoading && !candidatesQuery.data) {
    return (
      <SafeAreaView edges={['left', 'right']} style={styles.screen}>
        <TopBar leftIcon="arrow-back" onLeftPress={() => router.back()} title="Candidatos" />
        <View style={styles.body}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <LoadingCard />
            <LoadingCard />
          </ScrollView>
          <BottomNav accountType="bar" active="home" />
        </View>
      </SafeAreaView>
    );
  }

  if (candidatesQuery.isError || !candidatesQuery.data) {
    return (
      <SafeAreaView edges={['left', 'right']} style={styles.screen}>
        <TopBar leftIcon="arrow-back" onLeftPress={() => router.back()} title="Candidatos" />
        <View style={styles.body}>
          <View style={styles.contentWrap}>
            <EmptyState
              description={
                candidatesQuery.error instanceof Error
                  ? candidatesQuery.error.message
                  : 'Nao foi possivel carregar a lista de candidatos desta vaga.'
              }
              eyebrow="Erro"
              title="Falha ao abrir candidatos"
            />
          </View>
          <BottomNav accountType="bar" active="home" />
        </View>
      </SafeAreaView>
    );
  }

  const { activeContractApplicationId, activeContractStatus, candidates, opportunity } =
    candidatesQuery.data;

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.screen}>
      <TopBar leftIcon="arrow-back" onLeftPress={() => router.back()} title="Candidatos" />

      <View style={styles.body}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <GlassCard padding={spacing.xl} surface="panel">
            <Text style={styles.sectionEyebrow}>Vaga publicada</Text>
            <Text style={styles.sectionTitle}>{opportunity.title}</Text>
            <Text style={styles.sectionCopy}>{formatOpportunityScheduleLabel(opportunity)}</Text>
            <View style={styles.summaryRow}>
              <SummaryMetric label="Cache" value={formatOpportunityBudget(opportunity.budget_cents)} />
              <SummaryMetric label="Candidatos" value={String(candidates.length)} />
            </View>
            {activeContractStatus ? (
              <View style={styles.summaryChipWrap}>
                <Chip
                  label={formatContractStatusLabel(activeContractStatus)}
                  tone={mapContractToneToChip(activeContractStatus)}
                />
              </View>
            ) : null}
          </GlassCard>

          {candidates.length > 0 ? (
            <View style={styles.list}>
              {candidates.map((candidate) => (
                <GlassCard key={candidate.application.id} padding={spacing.lg} style={styles.card} surface="panel">
                  <View style={styles.cardTop}>
                    <ImageUri
                      source={candidate.coverImageUrl ?? defaultArtistImage}
                      style={styles.avatar}
                    />
                    <View style={styles.cardCopy}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.candidateName}>{candidate.stageName}</Text>
                        <RatingPill
                          ratingAverage={candidate.ratingAverage}
                          ratingCount={candidate.ratingCount}
                        />
                      </View>
                      <Text style={styles.candidateMeta}>
                        {candidate.artistCategory || 'Categoria artistica ainda nao informada'}
                      </Text>
                      <Text style={styles.candidateMeta}>
                        {[candidate.city, candidate.state].filter(Boolean).join('/')}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.chipsRow}>
                    {candidate.genres.map((genre) => (
                      <View key={`${candidate.artistId}-${genre}`} style={styles.metaChip}>
                        <Text style={styles.metaChipText}>{genre}</Text>
                      </View>
                    ))}
                    {candidate.baseCacheCents !== null ? (
                      <View style={[styles.metaChip, styles.metaChipPrimary]}>
                        <Text style={styles.metaChipPrimaryText}>
                          Cache base {formatOpportunityBudget(candidate.baseCacheCents)}
                        </Text>
                      </View>
                    ) : null}
                    {candidate.contract ? (
                      <View
                        style={[
                          styles.metaChip,
                          candidate.contract.status === 'confirmed'
                            ? styles.metaChipPrimary
                            : styles.metaChipRecurring,
                        ]}>
                        <Text
                          style={[
                            candidate.contract.status === 'confirmed'
                              ? styles.metaChipPrimaryText
                              : styles.metaChipRecurringText,
                          ]}>
                          {formatContractStatusLabel(candidate.contract.status)}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.bottomRow}>
                    <GhostButton
                      containerStyle={styles.actionButton}
                      icon="forum"
                      label="Conversar"
                      onPress={() => router.push(`/chat/application/${candidate.application.id}`)}
                    />
                    <GhostButton
                      containerStyle={styles.actionButton}
                      icon="visibility"
                      label="Ver candidato"
                      onPress={() => router.push(`/bar/candidate/${candidate.application.id}`)}
                    />
                  </View>
                  {activeContractApplicationId &&
                  activeContractApplicationId !== candidate.application.id ? (
                    <Text style={styles.selectionHint}>
                      Esta vaga ja esta em processo de contratacao com outro musico.
                    </Text>
                  ) : null}
                </GlassCard>
              ))}
            </View>
          ) : (
            <EmptyState
              description="Quando um musico se candidatar a esta vaga, ele aparecera aqui com score, portfolio e historico de reputacao."
              eyebrow="Sem candidatos"
              title="Ainda nao ha candidaturas"
            />
          )}
        </ScrollView>

        <BottomNav accountType="bar" active="home" />
      </View>
    </SafeAreaView>
  );
}

function mapContractToneToChip(status: 'cancelled' | 'completed' | 'confirmed' | 'pending_confirmation') {
  const tone = getContractTone(status);

  if (tone === 'primary') {
    return 'primary' as const;
  }

  if (tone === 'secondary') {
    return 'secondary' as const;
  }

  return 'neutral' as const;
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function RatingPill({
  ratingAverage,
  ratingCount,
}: {
  ratingAverage: number | null;
  ratingCount: number;
}) {
  if (ratingAverage === null || ratingCount === 0) {
    return (
      <View style={styles.ratingPillMuted}>
        <MaterialIcons color={colors.onSurfaceVariant} name="star-border" size={14} />
        <Text style={styles.ratingPillMutedText}>Sem reviews</Text>
      </View>
    );
  }

  return (
    <View style={styles.ratingPill}>
      <MaterialIcons color={colors.primary} name="star" size={14} />
      <Text style={styles.ratingPillText}>
        {ratingAverage.toFixed(1)} ({ratingCount})
      </Text>
    </View>
  );
}

function LoadingCard() {
  return (
    <GlassCard padding={spacing.lg} style={styles.card} surface="panel">
      <View style={styles.loadingBlock} />
      <View style={[styles.loadingBlock, styles.loadingWide]} />
      <View style={[styles.loadingBlock, styles.loadingAction]} />
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  body: {
    flex: 1,
  },
  content: {
    gap: spacing.lg,
    paddingBottom: 132,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  contentWrap: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
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
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  summaryChipWrap: {
    alignItems: 'flex-start',
  },
  metricCard: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.lg,
    flex: 1,
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
  list: {
    gap: spacing.md,
  },
  card: {
    gap: spacing.md,
  },
  cardTop: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  avatar: {
    borderRadius: radii.lg,
    height: 76,
    width: 76,
  },
  cardCopy: {
    flex: 1,
    gap: 4,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  candidateName: {
    ...typography.cardTitle,
    color: colors.onSurface,
    flex: 1,
  },
  candidateMeta: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
  },
  ratingPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(243,255,202,0.12)',
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  ratingPillText: {
    ...typography.label,
    color: colors.primary,
  },
  ratingPillMuted: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  ratingPillMutedText: {
    ...typography.label,
    color: colors.onSurfaceVariant,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metaChip: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  metaChipText: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
  },
  metaChipPrimary: {
    backgroundColor: 'rgba(243,255,202,0.12)',
  },
  metaChipPrimaryText: {
    ...typography.bodyMedium,
    color: colors.primary,
  },
  metaChipRecurring: {
    backgroundColor: 'rgba(0,238,252,0.14)',
  },
  metaChipRecurringText: {
    ...typography.bodyMedium,
    color: colors.secondary,
  },
  bottomRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  actionButton: {
    alignSelf: 'center',
    minWidth: 152,
  },
  selectionHint: {
    ...typography.label,
    color: colors.onSurfaceVariant,
  },
  loadingBlock: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radii.pill,
    height: 18,
    width: '42%',
  },
  loadingWide: {
    width: '76%',
  },
  loadingAction: {
    height: 44,
    width: '100%',
  },
});
