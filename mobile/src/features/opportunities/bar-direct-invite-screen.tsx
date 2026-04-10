import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  formatOpportunityBudget,
  formatOpportunityScheduleLabel,
  formatOpportunityStatusLabel,
  getOpportunityStatusTone,
  useBarOpportunityDashboard,
  useCreateDirectOpportunityInvite,
} from '@/src/features/opportunities/opportunities';
import { useBarArtistDetail } from '@/src/features/search/bar-artist-search';
import {
  BottomNav,
  Chip,
  EmptyState,
  GhostButton,
  GlassCard,
  GlowButton,
  TopBar,
} from '@/src/shared/components';
import { colors, radii, spacing, typography } from '@/src/shared/theme';

export function BarDirectInviteScreen({
  artistId,
  highlightedOpportunityId,
}: {
  artistId?: string;
  highlightedOpportunityId?: string;
}) {
  const router = useRouter();
  const artistQuery = useBarArtistDetail(artistId);
  const dashboardQuery = useBarOpportunityDashboard();
  const inviteMutation = useCreateDirectOpportunityInvite();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const opportunities = useMemo(() => {
    const items =
      dashboardQuery.data?.opportunities.filter(
        (opportunity) => opportunity.status === 'draft' || opportunity.status === 'open',
      ) ?? [];

    if (!highlightedOpportunityId) {
      return items;
    }

    return [...items].sort((left, right) => {
      if (left.id === highlightedOpportunityId) {
        return -1;
      }

      if (right.id === highlightedOpportunityId) {
        return 1;
      }

      return 0;
    });
  }, [dashboardQuery.data?.opportunities, highlightedOpportunityId]);

  if (!artistId) {
    return (
      <SafeAreaView edges={['left', 'right']} style={styles.screen}>
        <TopBar leftIcon="arrow-back" onLeftPress={() => router.back()} title="Convite direto" />
        <View style={styles.body}>
          <View style={styles.contentWrap}>
            <EmptyState
              description="Volte para a busca, abra o perfil do artista e tente novamente."
              eyebrow="Marketplace"
              title="Artista nao identificado"
            />
          </View>
          <BottomNav accountType="bar" active="search" />
        </View>
      </SafeAreaView>
    );
  }

  if ((artistQuery.isLoading || dashboardQuery.isLoading) && (!artistQuery.data || !dashboardQuery.data)) {
    return (
      <SafeAreaView edges={['left', 'right']} style={styles.screen}>
        <TopBar leftIcon="arrow-back" onLeftPress={() => router.back()} title="Convite direto" />
        <View style={styles.body}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <LoadingCard />
            <LoadingCard />
          </ScrollView>
          <BottomNav accountType="bar" active="search" />
        </View>
      </SafeAreaView>
    );
  }

  if (artistQuery.isError || !artistQuery.data) {
    return (
      <SafeAreaView edges={['left', 'right']} style={styles.screen}>
        <TopBar leftIcon="arrow-back" onLeftPress={() => router.back()} title="Convite direto" />
        <View style={styles.body}>
          <View style={styles.contentWrap}>
            <EmptyState
              description={
                artistQuery.error instanceof Error
                  ? artistQuery.error.message
                  : 'Nao foi possivel carregar o artista para convite.'
              }
              eyebrow="Erro"
              title="Falha ao abrir o artista"
            />
          </View>
          <BottomNav accountType="bar" active="search" />
        </View>
      </SafeAreaView>
    );
  }

  if (dashboardQuery.isError) {
    return (
      <SafeAreaView edges={['left', 'right']} style={styles.screen}>
        <TopBar leftIcon="arrow-back" onLeftPress={() => router.back()} title="Convite direto" />
        <View style={styles.body}>
          <View style={styles.contentWrap}>
            <EmptyState
              description={
                dashboardQuery.error instanceof Error
                  ? dashboardQuery.error.message
                  : 'Nao foi possivel carregar as vagas disponiveis para convite.'
              }
              eyebrow="Erro"
              title="Falha ao abrir as vagas"
            />
          </View>
          <BottomNav accountType="bar" active="search" />
        </View>
      </SafeAreaView>
    );
  }

  const resolvedArtistId = artistId;
  const artistName = artistQuery.data.artist.stageName;

  async function handleSendInvite(opportunityId: string) {
    setErrorMessage(null);

    try {
      const applicationId = await inviteMutation.mutateAsync({
        artistId: resolvedArtistId,
        opportunityId,
      });

      router.replace(`/bar/candidate/${applicationId}`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Nao foi possivel enviar este convite.',
      );
    }
  }

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.screen}>
      <TopBar leftIcon="arrow-back" onLeftPress={() => router.back()} title="Convite direto" />

      <View style={styles.body}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <GlassCard padding={spacing.xl} surface="panel">
            <Text style={styles.sectionEyebrow}>Convite privado</Text>
            <Text style={styles.sectionTitle}>Escolha qual vaga sera enviada para {artistName}.</Text>
            <Text style={styles.sectionCopy}>
              O convite abre chat, cria a contratacao pendente e leva o musico direto para a decisao
              de aceitar ou recusar.
            </Text>

            <View style={styles.heroActions}>
              <GhostButton
                icon="add-circle"
                label="Criar vaga e voltar aqui"
                onPress={() =>
                  router.push(`/bar/opportunities/new?inviteArtistId=${resolvedArtistId}`)
                }
              />
            </View>
          </GlassCard>

          {highlightedOpportunityId ? (
            <GlassCard padding={spacing.lg} style={styles.featuredCard} surface="panel">
              <Text style={styles.featuredTitle}>Nova vaga pronta para convite</Text>
              <Text style={styles.sectionCopy}>
                A vaga recem-criada foi trazida para o topo. Revise o card abaixo e envie o convite.
              </Text>
            </GlassCard>
          ) : null}

          {errorMessage ? (
            <GlassCard padding={spacing.lg} style={styles.feedbackCard} surface="panel">
              <Text style={styles.errorText}>{errorMessage}</Text>
            </GlassCard>
          ) : null}

          {opportunities.length > 0 ? (
            <View style={styles.list}>
              {opportunities.map((opportunity) => {
                const isHighlighted = opportunity.id === highlightedOpportunityId;

                return (
                  <GlassCard
                    key={opportunity.id}
                    padding={spacing.xl}
                    style={[styles.card, isHighlighted && styles.cardHighlighted]}
                    surface="panel">
                    <View style={styles.cardHeader}>
                      <View style={styles.cardCopy}>
                        <Text style={styles.cardTitle}>{opportunity.title}</Text>
                        <Text style={styles.cardMeta}>{formatOpportunityScheduleLabel(opportunity)}</Text>
                      </View>
                      <Chip
                        label={formatOpportunityStatusLabel(opportunity.status)}
                        tone={mapOpportunityTone(opportunity.status)}
                      />
                    </View>

                    <View style={styles.metaRow}>
                      {opportunity.music_genres.map((genre) => (
                        <View key={`${opportunity.id}-${genre}`} style={styles.metaChip}>
                          <Text style={styles.metaChipText}>{genre}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.summaryRow}>
                      <SummaryMetric label="Cache" value={formatOpportunityBudget(opportunity.budget_cents)} />
                      <SummaryMetric label="Local" value={`${opportunity.city}/${opportunity.state}`} />
                    </View>

                    <Text style={styles.locationCopy}>{opportunity.location_label}</Text>

                    {isHighlighted ? (
                      <GlowButton
                        containerStyle={styles.primaryAction}
                        disabled={inviteMutation.isPending}
                        icon="campaign"
                        label={inviteMutation.isPending ? 'Enviando convite' : 'Enviar convite agora'}
                        onPress={() => void handleSendInvite(opportunity.id)}
                      />
                    ) : (
                      <GhostButton
                        containerStyle={styles.primaryAction}
                        icon="campaign"
                        label="Enviar convite"
                        onPress={() => void handleSendInvite(opportunity.id)}
                      />
                    )}
                  </GlassCard>
                );
              })}
            </View>
          ) : (
            <EmptyState
              description="Voce precisa ter ao menos uma vaga aberta ou em rascunho para usar convite direto."
              eyebrow="Sem vagas elegiveis"
              title="Nenhuma vaga pronta para convite"
            />
          )}
        </ScrollView>

        <BottomNav accountType="bar" active="search" />
      </View>
    </SafeAreaView>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function LoadingCard() {
  return (
    <GlassCard padding={spacing.xl} style={styles.card} surface="panel">
      <View style={styles.loadingBlock} />
      <View style={[styles.loadingBlock, styles.loadingWide]} />
      <View style={[styles.loadingBlock, styles.loadingAction]} />
    </GlassCard>
  );
}

function mapOpportunityTone(status: 'cancelled' | 'closed' | 'draft' | 'open') {
  const tone = getOpportunityStatusTone(status);

  if (tone === 'primary') {
    return 'primary' as const;
  }

  if (tone === 'secondary') {
    return 'secondary' as const;
  }

  return 'neutral' as const;
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
  heroActions: {
    marginTop: spacing.md,
  },
  featuredCard: {
    borderColor: colors.primaryContainer,
    borderWidth: 1,
  },
  featuredTitle: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  feedbackCard: {
    borderColor: colors.error,
    borderWidth: 1,
  },
  errorText: {
    ...typography.bodyMedium,
    color: colors.error,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    gap: spacing.md,
  },
  cardHighlighted: {
    borderColor: colors.primaryContainer,
    borderWidth: 1,
  },
  cardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  cardCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  cardTitle: {
    ...typography.bodyBold,
    color: colors.onSurface,
  },
  cardMeta: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
  },
  metaRow: {
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
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metricCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.md,
    flex: 1,
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  metricLabel: {
    ...typography.label,
    color: colors.onSurfaceVariant,
  },
  metricValue: {
    ...typography.bodyBold,
    color: colors.onSurface,
  },
  locationCopy: {
    ...typography.bodyMedium,
    color: colors.secondary,
  },
  primaryAction: {
    marginTop: spacing.sm,
  },
  loadingBlock: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radii.pill,
    height: 20,
  },
  loadingWide: {
    width: '76%',
  },
  loadingAction: {
    height: 52,
    marginTop: spacing.md,
  },
});
