import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  buildContractOperationalReminders,
  compareContractAgendaItems,
  formatContractAgendaScheduleLabel,
  formatContractStatusLabel,
  getContractTone,
  isContractHistoryItem,
  useContractAgenda,
} from '@/src/features/contracts/contracts';
import { OperationalReminderCard } from '@/src/features/contracts/operational-reminder-card';
import {
  formatOpportunityBudget,
  formatOpportunityScheduleLabel,
  formatOpportunityStatusLabel,
  formatRecurrenceDaysLabel,
  getOpportunityStatusTone,
  useBarOpportunityDashboard,
  useUpdateOpportunityStatus,
  type OpportunityStatus,
} from '@/src/features/opportunities/opportunities';
import {
  type BarArtistSearchRecord,
  useBarArtistSearch,
} from '@/src/features/search/bar-artist-search';
import {
  BottomNav,
  Chip,
  EmptyState,
  GhostButton,
  GlassCard,
  GlowButton,
  ImageUri,
  TopBar,
} from '@/src/shared/components';
import { barHomeHeroImage } from '@/src/shared/data/prototype';
import { colors, radii, spacing, typography } from '@/src/shared/theme';

export default function BarHomeScreen() {
  const router = useRouter();
  const dashboardQuery = useBarOpportunityDashboard();
  const agendaQuery = useContractAgenda('bar');
  const artistSearchQuery = useBarArtistSearch();
  const updateOpportunityStatus = useUpdateOpportunityStatus();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const opportunities = dashboardQuery.data?.opportunities ?? [];
  const venueProfile = dashboardQuery.data?.venueProfile ?? null;
  const locationLabel = [venueProfile?.city, venueProfile?.state]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(', ');
  const openCount = opportunities.filter((item) => item.status === 'open').length;
  const draftCount = opportunities.filter((item) => item.status === 'draft').length;
  const cancelledCount = opportunities.filter((item) => item.status === 'cancelled').length;
  const activeContracts = [...(agendaQuery.data ?? [])]
    .filter((item) => !isContractHistoryItem(item))
    .sort(compareContractAgendaItems);
  const reminders = buildContractOperationalReminders(activeContracts, 'bar').slice(0, 2);
  const nextContract = activeContracts[0] ?? null;
  const artists = artistSearchQuery.data?.artists ?? [];
  const featuredArtists = artists.slice(0, 4);
  const nearbyArtists = selectNearbyArtists(
    artists,
    venueProfile?.city ?? artistSearchQuery.data?.venueCity ?? null,
    venueProfile?.state ?? artistSearchQuery.data?.venueState ?? null,
  ).slice(0, 4);
  const genreChips = ['Todos', ...Array.from(new Set(artists.flatMap((artist) => artist.genres))).slice(0, 5)];

  async function handleStatusChange(opportunityId: string, status: OpportunityStatus) {
    setErrorMessage(null);
    setFeedback(null);

    try {
      await updateOpportunityStatus.mutateAsync({ opportunityId, status });
      setFeedback(
        status === 'cancelled'
          ? 'Vaga cancelada e retirada do feed publico.'
          : 'Vaga reaberta e disponivel novamente para os musicos.',
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Nao foi possivel atualizar o status da vaga.',
      );
    }
  }

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.screen}>
      <TopBar centeredBrand location={locationLabel || 'Operacao do Bar'} title="TocaAI" />

      <View style={styles.body}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroWrap}>
            <ImageUri source={barHomeHeroImage} style={styles.heroImage} />
            <LinearGradient
              colors={['rgba(0,0,0,0.10)', 'rgba(0,0,0,0.78)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.heroCopy}>
              <Text style={styles.heroEyebrow}>Conecte-se a cena</Text>
              <Text style={styles.heroTitle}>Encontre o Som{'\n'}Perfeito.</Text>
              <GlowButton
                icon="add-circle"
                label="Publicar vaga"
                onPress={() => router.push('/bar/opportunities/new')}
              />
            </View>
          </View>

          <View style={styles.quickActions}>
            <GhostButton
              icon="rocket-launch"
              label="Nova vaga"
              onPress={() => router.push('/bar/opportunities/new')}
            />
            <GhostButton icon="search" label="Buscar artistas" onPress={() => router.push('/search')} />
            <GhostButton icon="calendar-today" label="Agenda" onPress={() => router.push('/bar/agenda')} />
          </View>

          <View style={styles.metricsRow}>
            <MetricCard label="Abertas" tone="primary" value={String(openCount)} />
            <MetricCard label="Rascunhos" tone="secondary" value={String(draftCount)} />
            <MetricCard label="Canceladas" tone="muted" value={String(cancelledCount)} />
          </View>

          {(errorMessage || feedback) && (
            <GlassCard padding={spacing.lg} style={styles.feedbackCard} surface="panel">
              {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
              {feedback ? <Text style={styles.feedbackText}>{feedback}</Text> : null}
            </GlassCard>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Agenda em destaque</Text>
            <GhostButton
              icon="calendar-today"
              label="Abrir agenda"
              onPress={() => router.push('/bar/agenda')}
            />
          </View>

          {agendaQuery.isLoading && !agendaQuery.data ? (
            <GlassCard padding={spacing.lg} style={styles.agendaCard} surface="panel">
              <LoadingBlock style={styles.loadingTitle} />
              <LoadingBlock style={styles.loadingMeta} />
              <LoadingBlock style={styles.loadingActionRow} />
            </GlassCard>
          ) : nextContract ? (
            <GlassCard padding={spacing.lg} style={styles.agendaCard} surface="panel">
              <View style={styles.agendaCardTop}>
                <View style={styles.agendaCardCopy}>
                  <Text style={styles.agendaEyebrow}>Proximo compromisso</Text>
                  <Text style={styles.agendaTitle}>{nextContract.opportunity.title}</Text>
                  <Text style={styles.agendaMeta}>
                    {formatContractAgendaScheduleLabel(nextContract.opportunity)}
                  </Text>
                </View>
                <StatusBadge
                  label={formatContractStatusLabel(nextContract.contract.status)}
                  tone={mapContractToneToBadge(nextContract.contract.status)}
                />
              </View>
              <Text style={styles.agendaCounterpart}>
                Com {nextContract.counterpartName}
                {nextContract.counterpartMeta ? ` - ${nextContract.counterpartMeta}` : ''}
              </Text>
              <View style={styles.inlineActions}>
                <GhostButton
                  icon="forum"
                  label="Conversar"
                  onPress={() => router.push(`/chat/application/${nextContract.applicationId}`)}
                />
                <GhostButton
                  icon="visibility"
                  label="Ver contratacao"
                  onPress={() => router.push(`/bar/candidate/${nextContract.applicationId}`)}
                />
              </View>
            </GlassCard>
          ) : (
            <EmptyState
              eyebrow="Agenda do Bar"
              title="Nenhuma contratacao ativa agora"
              description="Assim que um candidato for selecionado e a contratacao entrar no fluxo, a agenda comecara a refletir seus proximos shows."
            />
          )}

          {reminders.length > 0 ? (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Lembretes operacionais</Text>
                <Text style={styles.link}>Acompanhamento imediato</Text>
              </View>

              <View style={styles.reminderList}>
                {reminders.map((reminder) => (
                  <OperationalReminderCard
                    key={reminder.contractId}
                    reminder={reminder}
                    onOpenChat={() => router.push(`/chat/application/${reminder.applicationId}`)}
                    onOpenDetail={() => router.push(`/bar/candidate/${reminder.applicationId}`)}
                  />
                ))}
              </View>
            </>
          ) : null}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Suas vagas</Text>
            <Text style={styles.link}>
              {openCount > 0 ? `${openCount} abertas no feed` : 'Publique sua primeira vaga'}
            </Text>
          </View>

          {dashboardQuery.isLoading && !dashboardQuery.data ? (
            <View style={styles.ownOpportunityList}>
              <OpportunityLoadingCard />
              <OpportunityLoadingCard />
            </View>
          ) : opportunities.length > 0 ? (
            <View style={styles.ownOpportunityList}>
              {opportunities.slice(0, 4).map((opportunity) => (
                <GlassCard
                  key={opportunity.id}
                  padding={spacing.lg}
                  style={styles.ownOpportunityCard}
                  surface="panel">
                  <View style={styles.ownOpportunityTop}>
                    <View style={styles.ownOpportunityCopy}>
                      <Text style={styles.ownOpportunityTitle}>{opportunity.title}</Text>
                      <Text style={styles.ownOpportunityMeta}>
                        {formatOpportunityScheduleLabel(opportunity)}
                      </Text>
                    </View>
                    <StatusBadge
                      label={formatOpportunityStatusLabel(opportunity.status)}
                      tone={getOpportunityStatusTone(opportunity.status)}
                    />
                  </View>

                  <View style={styles.opportunityChips}>
                    {opportunity.music_genres.map((genre) => (
                      <View key={`${opportunity.id}-${genre}`} style={styles.metaChip}>
                        <Text style={styles.metaChipText}>{genre}</Text>
                      </View>
                    ))}
                    {opportunity.recurrence_days.length > 0 ? (
                      <View style={[styles.metaChip, styles.metaChipRecurring]}>
                        <Text style={styles.metaChipRecurringText}>
                          Toda {formatRecurrenceDaysLabel(opportunity.recurrence_days)}
                        </Text>
                      </View>
                    ) : null}
                    {opportunity.artist_category ? (
                      <View style={styles.metaChip}>
                        <Text style={styles.metaChipText}>{opportunity.artist_category}</Text>
                      </View>
                    ) : null}
                    <View style={styles.metaChip}>
                      <Text style={styles.metaChipText}>{opportunity.location_label}</Text>
                    </View>
                    {opportunity.is_urgent ? (
                      <View style={[styles.metaChip, styles.metaChipUrgent]}>
                        <Text style={styles.metaChipUrgentText}>Urgente</Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.ownOpportunityBottom}>
                    <Text style={styles.price}>
                      {formatOpportunityBudget(opportunity.budget_cents)}
                      <Text style={styles.priceSuffix}>/show</Text>
                    </Text>
                    <View style={styles.inlineActions}>
                      <GhostButton
                        icon="edit"
                        label="Editar"
                        onPress={() => router.push(`/bar/opportunities/${opportunity.id}`)}
                      />
                      <GhostButton
                        icon="groups"
                        label="Candidatos"
                        onPress={() => router.push(`/bar/candidates/${opportunity.id}`)}
                      />
                      <GhostButton
                        icon={opportunity.status === 'cancelled' ? 'restart-alt' : 'cancel'}
                        label={opportunity.status === 'cancelled' ? 'Reabrir' : 'Cancelar'}
                        onPress={() =>
                          void handleStatusChange(
                            opportunity.id,
                            opportunity.status === 'cancelled' ? 'open' : 'cancelled',
                          )
                        }
                      />
                    </View>
                  </View>
                </GlassCard>
              ))}
            </View>
          ) : (
            <EmptyState
              description="Quando a primeira vaga for publicada, ela aparecera aqui para edicao rapida e tambem entrara no feed do Musico."
              eyebrow="Marketplace"
              title="Nenhuma vaga publicada ainda"
            />
          )}

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
            <View style={styles.chipsInner}>
              {genreChips.map((genre, index) => (
                <Chip
                  active={index === 0}
                  key={genre}
                  label={genre}
                  tone={index === 0 ? 'primary' : 'neutral'}
                />
              ))}
            </View>
          </ScrollView>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Artistas para convidar</Text>
            <GhostButton icon="search" label="Busca ativa" onPress={() => router.push('/search')} />
          </View>

          {artistSearchQuery.isLoading && !artistSearchQuery.data ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.featuredRow}>
                <FeaturedArtistLoadingCard />
                <FeaturedArtistLoadingCard />
              </View>
            </ScrollView>
          ) : featuredArtists.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.featuredRow}>
                {featuredArtists.map((artist) => (
                  <Pressable
                    key={artist.artistId}
                    style={styles.featuredCard}
                    onPress={() => router.push(`/bar/artists/${artist.artistId}`)}>
                    <View style={styles.featuredImageWrap}>
                      <ImageUri source={artist.coverImageUrl ?? barHomeHeroImage} style={styles.featuredImage} />
                      {artist.ratingAverage !== null ? (
                        <View style={styles.liveBadge}>
                          <MaterialIcons color={colors.primary} name="star" size={12} />
                          <Text style={styles.liveLabel}>{artist.ratingAverage.toFixed(1)}</Text>
                        </View>
                      ) : null}
                      <LinearGradient
                        colors={['rgba(0,0,0,0.02)', 'rgba(0,0,0,0.92)']}
                        style={StyleSheet.absoluteFill}
                      />
                      <View style={styles.featuredCopy}>
                        <Text style={styles.featuredName}>{artist.stageName}</Text>
                        <Text style={styles.featuredGenre}>{buildArtistSummaryLine(artist)}</Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          ) : (
            <EmptyState
              eyebrow="Descoberta"
              title="Nenhum artista indexado ainda"
              description="Assim que os musicos completarem perfil, portfolio e estilos, a home do Bar passa a sugerir artistas reais para convite direto."
            />
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Na sua praca</Text>
            <Text style={styles.link}>
              {nearbyArtists.length > 0 ? 'Cidade e estado priorizados' : 'Sem recorte local ainda'}
            </Text>
          </View>

          <View style={styles.nearbyList}>
            {artistSearchQuery.isLoading && !artistSearchQuery.data ? (
              <>
                <NearbyArtistLoadingCard />
                <NearbyArtistLoadingCard />
              </>
            ) : nearbyArtists.length > 0 ? (
              nearbyArtists.map((artist) => (
                <Pressable
                  key={artist.artistId}
                  onPress={() => router.push(`/bar/artists/${artist.artistId}`)}>
                  <GlassCard padding={spacing.md} style={styles.nearbyCard}>
                    <View style={styles.nearbyIdentity}>
                      <ImageUri source={artist.coverImageUrl ?? barHomeHeroImage} style={styles.nearbyImage} />
                      <View style={styles.nearbyCopy}>
                        <View style={styles.nearbyTop}>
                          <Text style={styles.nearbyName}>{artist.stageName}</Text>
                          <View style={styles.ratingPill}>
                            <MaterialIcons color={colors.primary} name="star" size={14} />
                            <Text style={styles.ratingText}>
                              {artist.ratingAverage !== null
                                ? artist.ratingAverage.toFixed(1)
                                : '--'}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.nearbyGenre}>{buildArtistSummaryLine(artist)}</Text>
                        <View style={styles.nearbyBottom}>
                          <Text style={styles.price}>
                            {artist.baseCacheCents !== null
                              ? formatOpportunityBudget(artist.baseCacheCents)
                              : 'Cache a combinar'}
                            {artist.baseCacheCents !== null ? (
                              <Text style={styles.priceSuffix}>/noite</Text>
                            ) : null}
                          </Text>
                          <Text style={styles.ctaLink}>Abrir perfil</Text>
                        </View>
                      </View>
                    </View>
                  </GlassCard>
                </Pressable>
              ))
            ) : (
              <EmptyState
                eyebrow="Radar local"
                title="Nenhum artista da sua regiao agora"
                description="A busca ativa completa continua disponivel para ampliar o recorte por genero, categoria e faixa de cache."
              />
            )}
          </View>
        </ScrollView>

        <BottomNav accountType="bar" active="home" />
      </View>
    </SafeAreaView>
  );
}

function MetricCard({
  label,
  tone,
  value,
}: {
  label: string;
  tone: 'muted' | 'primary' | 'secondary';
  value: string;
}) {
  const valueColor =
    tone === 'primary' ? colors.primary : tone === 'secondary' ? colors.secondary : colors.onSurface;

  return (
    <GlassCard padding={spacing.md} style={styles.metricCard} surface="panel">
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color: valueColor }]}>{value}</Text>
    </GlassCard>
  );
}

function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: 'muted' | 'primary' | 'secondary';
}) {
  const badgeStyle =
    tone === 'primary'
      ? styles.badgePrimary
      : tone === 'secondary'
        ? styles.badgeSecondary
        : styles.badgeMuted;
  const textStyle =
    tone === 'primary'
      ? styles.badgeTextPrimary
      : tone === 'secondary'
        ? styles.badgeTextSecondary
        : styles.badgeTextMuted;

  return (
    <View style={[styles.badge, badgeStyle]}>
      <Text style={[styles.badgeText, textStyle]}>{label}</Text>
    </View>
  );
}

function OpportunityLoadingCard() {
  return (
    <GlassCard padding={spacing.lg} style={styles.ownOpportunityCard} surface="panel">
      <LoadingBlock style={styles.loadingTitle} />
      <LoadingBlock style={styles.loadingMeta} />
      <LoadingBlock style={styles.loadingChipRow} />
      <LoadingBlock style={styles.loadingActionRow} />
    </GlassCard>
  );
}

function FeaturedArtistLoadingCard() {
  return (
    <View style={styles.featuredCard}>
      <GlassCard padding={0} style={styles.featuredImageWrap} surface="panel">
        <View style={styles.featuredLoadingImage} />
      </GlassCard>
    </View>
  );
}

function NearbyArtistLoadingCard() {
  return (
    <GlassCard padding={spacing.md} style={styles.nearbyCard} surface="panel">
      <View style={styles.nearbyIdentity}>
        <View style={styles.nearbyImagePlaceholder} />
        <View style={styles.nearbyCopy}>
          <LoadingBlock style={styles.loadingMeta} />
          <LoadingBlock style={styles.loadingMetaWide} />
          <LoadingBlock style={styles.loadingMeta} />
        </View>
      </View>
    </GlassCard>
  );
}

function LoadingBlock({ style }: { style: object }) {
  return <View style={[styles.loadingBlock, style]} />;
}

function selectNearbyArtists(
  artists: BarArtistSearchRecord[],
  venueCity: string | null,
  venueState: string | null,
) {
  const normalizedCity = venueCity?.trim().toLowerCase();
  const normalizedState = venueState?.trim().toUpperCase();
  const localArtists = artists.filter((artist) => {
    const artistCity = artist.city?.trim().toLowerCase();
    const artistState = artist.state?.trim().toUpperCase();

  if (normalizedCity && normalizedState && artistCity === normalizedCity && artistState === normalizedState) {
      return true;
    }

    if (normalizedState && artistState === normalizedState) {
      return true;
    }

    return false;
  });

  const distanceArtists = artists
    .filter((artist) => artist.distanceKm !== null)
    .sort((left, right) => (left.distanceKm ?? Number.POSITIVE_INFINITY) - (right.distanceKm ?? Number.POSITIVE_INFINITY));

  if (distanceArtists.length > 0) {
    return distanceArtists;
  }

  return localArtists.length > 0 ? localArtists : artists;
}

function buildArtistSummaryLine(artist: BarArtistSearchRecord) {
  const leadingGenre = artist.genres.slice(0, 2).join(' - ');
  const location = [artist.city, artist.state].filter(Boolean).join('/');

  return [leadingGenre || artist.artistCategory || 'Perfil artistico', location || null]
    .filter((value): value is string => Boolean(value))
    .join(' - ');
}

function mapContractToneToBadge(status: 'cancelled' | 'completed' | 'confirmed' | 'pending_confirmation') {
  return getContractTone(status);
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
    position: 'relative',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 132,
    gap: spacing.xl,
  },
  heroWrap: {
    height: 208,
    borderRadius: radii.xl,
    overflow: 'hidden',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  heroCopy: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing.lg,
    gap: spacing.md,
  },
  heroEyebrow: {
    ...typography.label,
    color: colors.secondary,
  },
  heroTitle: {
    ...typography.heroTitle,
    color: colors.primary,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metricCard: {
    flex: 1,
    minHeight: 88,
    justifyContent: 'space-between',
  },
  metricLabel: {
    ...typography.label,
    color: colors.onSurfaceVariant,
  },
  metricValue: {
    ...typography.screenTitle,
  },
  feedbackCard: {
    gap: spacing.sm,
  },
  errorText: {
    ...typography.bodyMedium,
    color: '#ffb2b9',
  },
  feedbackText: {
    ...typography.bodyMedium,
    color: colors.secondary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.onSurface,
    flex: 1,
  },
  link: {
    ...typography.label,
    color: colors.secondary,
    textAlign: 'right',
  },
  agendaCard: {
    gap: spacing.md,
  },
  agendaCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  agendaCardCopy: {
    flex: 1,
    gap: 4,
  },
  agendaEyebrow: {
    ...typography.label,
    color: colors.secondary,
  },
  agendaTitle: {
    ...typography.cardTitle,
    color: colors.onSurface,
  },
  agendaMeta: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
  },
  agendaCounterpart: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
  },
  reminderList: {
    gap: spacing.md,
  },
  ownOpportunityList: {
    gap: spacing.md,
  },
  ownOpportunityCard: {
    backgroundColor: colors.surfaceContainerLow,
    gap: spacing.md,
  },
  ownOpportunityTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  ownOpportunityCopy: {
    flex: 1,
    gap: 4,
  },
  ownOpportunityTitle: {
    ...typography.cardTitle,
    color: colors.onSurface,
  },
  ownOpportunityMeta: {
    ...typography.bodyMedium,
    color: colors.secondary,
  },
  badge: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  badgePrimary: {
    backgroundColor: colors.primary,
  },
  badgeSecondary: {
    backgroundColor: 'rgba(0,238,252,0.14)',
  },
  badgeMuted: {
    backgroundColor: 'rgba(37,37,49,0.82)',
  },
  badgeText: {
    ...typography.label,
  },
  badgeTextPrimary: {
    color: colors.onPrimaryFixed,
  },
  badgeTextSecondary: {
    color: colors.secondary,
  },
  badgeTextMuted: {
    color: colors.onSurfaceVariant,
  },
  opportunityChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metaChip: {
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    backgroundColor: colors.surfaceContainerHigh,
  },
  metaChipText: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
  },
  metaChipUrgent: {
    backgroundColor: 'rgba(167,1,56,0.88)',
  },
  metaChipUrgentText: {
    ...typography.bodyMedium,
    color: '#ffb2b9',
  },
  metaChipRecurring: {
    backgroundColor: 'rgba(0,238,252,0.14)',
  },
  metaChipRecurringText: {
    ...typography.bodyMedium,
    color: colors.secondary,
  },
  ownOpportunityBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  inlineActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    flex: 1,
  },
  chipsRow: {
    marginHorizontal: -spacing.lg,
  },
  chipsInner: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  featuredRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  featuredCard: {
    width: 200,
  },
  featuredImageWrap: {
    height: 260,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  featuredImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  featuredLoadingImage: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surfaceContainerLowest,
  },
  featuredCopy: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
  },
  featuredName: {
    ...typography.bodyBold,
    color: colors.white,
    fontSize: 18,
  },
  featuredGenre: {
    ...typography.label,
    color: colors.secondary,
    marginTop: 4,
  },
  liveBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    zIndex: 2,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: 'rgba(13,13,22,0.84)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveLabel: {
    ...typography.label,
    color: colors.primary,
  },
  nearbyList: {
    gap: spacing.md,
  },
  nearbyCard: {
    backgroundColor: 'rgba(37,37,49,0.40)',
  },
  nearbyIdentity: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  nearbyImage: {
    width: 92,
    height: 92,
    borderRadius: radii.md,
  },
  nearbyImagePlaceholder: {
    width: 92,
    height: 92,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceContainerLowest,
  },
  nearbyCopy: {
    flex: 1,
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  nearbyTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  nearbyName: {
    ...typography.cardTitle,
    color: colors.onSurface,
    flex: 1,
    fontSize: 20,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radii.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.surfaceContainerHighest,
  },
  ratingText: {
    ...typography.bodyBold,
    color: colors.onSurface,
    fontSize: 12,
  },
  nearbyGenre: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
  },
  nearbyBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: spacing.md,
  },
  price: {
    ...typography.bodyBold,
    color: colors.primary,
    fontSize: 20,
  },
  priceSuffix: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
    fontSize: 11,
  },
  ctaLink: {
    ...typography.label,
    color: colors.secondaryDim,
  },
  loadingBlock: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  loadingTitle: {
    height: 28,
    width: '72%',
  },
  loadingMeta: {
    height: 18,
    width: '48%',
  },
  loadingMetaWide: {
    height: 18,
    width: '82%',
  },
  loadingChipRow: {
    height: 32,
    width: '100%',
  },
  loadingActionRow: {
    height: 44,
    width: '100%',
  },
});
