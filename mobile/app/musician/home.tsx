import { barHomeHeroImage } from '@/src/shared/data/prototype';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

import {
  buildContractOperationalReminders,
  formatContractStatusLabel,
  getContractTone,
  useContractAgenda,
} from '@/src/features/contracts/contracts';
import { OperationalReminderCard } from '@/src/features/contracts/operational-reminder-card';
import {
  formatOpportunityApplicationStatusLabel,
  formatOpportunityBudget,
  getOpportunityLocationMatchScope,
  getOpportunityNextOccurrenceDate,
  formatOpportunityScheduleLabel,
  formatRecurrenceDaysLabel,
  isDirectInviteApplication,
  type OpportunityFeedItem,
  type OpportunityLocationMatchScope,
  useMusicianOpportunityFeed,
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
import { formatDistanceKm } from '@/src/shared/lib/geolocation';
import { colors, radii, spacing, typography } from '@/src/shared/theme';

type MusicianDateScope = 'all' | 'month' | 'week';
type MusicianDistanceScope = 'all' | 'up_to_25' | 'up_to_50' | 'within_radius';
type MusicianRegionScope = 'all' | 'city' | 'state';
type MusicianBudgetScope = 'all' | 'budget_1000_plus' | 'budget_500_to_1000' | 'budget_up_to_500';

export default function MusicianHomeScreen() {
  const router = useRouter();
  const feedQuery = useMusicianOpportunityFeed();
  const agendaQuery = useContractAgenda('musician');
  const [selectedDateScope, setSelectedDateScope] = useState<MusicianDateScope>('month');
  const [selectedDistanceScope, setSelectedDistanceScope] = useState<MusicianDistanceScope>('all');
  const [selectedRegionScope, setSelectedRegionScope] = useState<MusicianRegionScope>('all');
  const [selectedBudgetScope, setSelectedBudgetScope] = useState<MusicianBudgetScope>('all');
  const opportunities = feedQuery.data?.opportunities ?? [];
  const reminders = buildContractOperationalReminders(agendaQuery.data ?? [], 'musician').slice(0, 2);
  const filteredOpportunities = filterMusicianOpportunities(opportunities, {
    artistCity: feedQuery.data?.artistCity ?? null,
    artistRadiusKm: feedQuery.data?.artistRadiusKm ?? null,
    artistState: feedQuery.data?.artistState ?? null,
    budgetScope: selectedBudgetScope,
    dateScope: selectedDateScope,
    distanceScope: selectedDistanceScope,
    regionScope: selectedRegionScope,
  });
  const title = feedQuery.data?.artistCity
    ? `Oportunidades em ${feedQuery.data.artistCity}`
    : 'Oportunidades em aberto';
  const regionOptions: Array<{ key: MusicianRegionScope; label: string }> = [
    ...(feedQuery.data?.artistCity ? [{ key: 'city' as const, label: 'Minha cidade' }] : []),
    ...(feedQuery.data?.artistState ? [{ key: 'state' as const, label: 'Meu estado' }] : []),
    { key: 'all' as const, label: 'Todas' },
  ];
  const dateOptions: Array<{ key: MusicianDateScope; label: string }> = [
    { key: 'week', label: '7 dias' },
    { key: 'month', label: '30 dias' },
    { key: 'all', label: 'Sem limite' },
  ];
  const budgetOptions: Array<{ key: MusicianBudgetScope; label: string }> = [
    { key: 'all', label: 'Todos os caches' },
    { key: 'budget_up_to_500', label: 'Ate R$ 500' },
    { key: 'budget_500_to_1000', label: 'R$ 500 a R$ 1.000' },
    { key: 'budget_1000_plus', label: 'R$ 1.000+' },
  ];
  const distanceOptions: Array<{ key: MusicianDistanceScope; label: string }> = [
    { key: 'all', label: 'Todas' },
    { key: 'within_radius', label: 'No meu raio' },
    { key: 'up_to_25', label: 'Ate 25 km' },
    { key: 'up_to_50', label: 'Ate 50 km' },
  ];

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.screen}>
      <TopBar align="left" title={title} />

      <View style={styles.body}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <GlassCard padding={spacing.lg} style={styles.filterPanel} surface="panel">
            <Text style={styles.filterEyebrow}>Radar do Musico</Text>
            <Text style={styles.filterTitle}>Filtre por periodo, regiao e faixa de cache.</Text>
            <Text style={styles.filterDescription}>
              O feed agora prioriza sua cidade, depois seu estado, e permite cortar rapidamente por
              janela de data e valor da vaga.
            </Text>

            <FilterSection
              eyebrow="Periodo"
              options={dateOptions}
              selectedKey={selectedDateScope}
              title="Quando voce quer tocar"
              onSelect={(value) => setSelectedDateScope(value)}
            />
            <FilterSection
              eyebrow="Regiao"
              options={regionOptions}
              selectedKey={selectedRegionScope}
              title="Onde faz sentido abrir primeiro"
              onSelect={(value) => setSelectedRegionScope(value)}
            />
            <FilterSection
              eyebrow="Cache"
              options={budgetOptions}
              selectedKey={selectedBudgetScope}
              title="Quanto a vaga paga"
              onSelect={(value) => setSelectedBudgetScope(value)}
            />
            <FilterSection
              eyebrow="Distancia"
              options={distanceOptions}
              selectedKey={selectedDistanceScope}
              title="Quanto voce precisa se deslocar"
              onSelect={(value) => setSelectedDistanceScope(value)}
            />
          </GlassCard>

          {reminders.length > 0 ? (
            <View style={styles.reminderList}>
              <View style={styles.reminderHeader}>
                <Text style={styles.reminderTitle}>Lembretes operacionais</Text>
                <Text style={styles.reminderLink}>Sua agenda pede atencao</Text>
              </View>
              {reminders.map((reminder) => (
                <OperationalReminderCard
                  key={reminder.contractId}
                  reminder={reminder}
                  onOpenChat={() => router.push(`/chat/application/${reminder.applicationId}`)}
                  onOpenDetail={() => router.push(`/musician/opportunities/${reminder.opportunityId}`)}
                />
              ))}
            </View>
          ) : null}

          <View style={styles.filterRow}>
            <View style={styles.inlineFilters}>
              <Chip label="Abertas" tone="primary" />
              <Chip
                label={
                  feedQuery.data?.artistState ? `Base ${feedQuery.data.artistState}` : 'Feed nacional'
                }
                tone="neutral"
              />
            </View>
            <GhostButton
              disabled
              icon="insights"
              label={`${filteredOpportunities.length} ${filteredOpportunities.length === 1 ? 'vaga' : 'vagas'}`}
            />
          </View>

          <View style={styles.feed}>
            {feedQuery.isLoading && !feedQuery.data ? (
              <>
                <OpportunityLoadingCard />
                <OpportunityLoadingCard />
              </>
            ) : filteredOpportunities.length > 0 ? (
              filteredOpportunities.map((opportunity) => {
                const isDirectInvite = isDirectInviteApplication(opportunity.applicationSource);
                const matchScope = getOpportunityLocationMatchScope(
                  opportunity,
                  feedQuery.data?.artistCity ?? null,
                  feedQuery.data?.artistState ?? null,
                );

                return (
                  <GlassCard key={opportunity.id} padding={0} style={styles.opportunityCard}>
                  <View style={styles.opportunityImageWrap}>
                    <ImageUri
                      source={opportunity.venueCoverImageUrl ?? barHomeHeroImage}
                      style={styles.opportunityImage}
                    />
                    {opportunity.is_urgent ? (
                      <View style={styles.urgentBadge}>
                        <View style={styles.urgentDot} />
                        <Text style={styles.urgentLabel}>Urgente</Text>
                      </View>
                    ) : null}
                    <View style={styles.priceBadge}>
                      <Text style={styles.priceBadgeText}>
                        {formatOpportunityBudget(opportunity.budget_cents)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.opportunityContent}>
                    <Text style={styles.opportunityTitle}>{opportunity.venueName}</Text>
                    <Text style={styles.opportunityTime}>
                      {formatOpportunityScheduleLabel(opportunity)}
                    </Text>

                    <View style={styles.opportunityChips}>
                      <View
                        style={[
                          styles.metaChip,
                          matchScope === 'city'
                            ? styles.matchChipCity
                            : matchScope === 'state'
                              ? styles.matchChipState
                              : styles.matchChipNational,
                        ]}>
                        <Text
                          style={[
                            styles.metaChipText,
                            matchScope === 'city'
                              ? styles.matchChipTextCity
                              : matchScope === 'state'
                                ? styles.matchChipTextState
                                : styles.matchChipTextNational,
                          ]}>
                          {formatLocationMatchLabel(matchScope)}
                        </Text>
                      </View>
                      {opportunity.music_genres.map((genre) => (
                        <View key={`${opportunity.id}-${genre}`} style={styles.metaChip}>
                          <Text style={styles.metaChipText}>{genre}</Text>
                        </View>
                      ))}
                      {opportunity.distanceKm !== null ? (
                        <View style={[styles.metaChip, styles.metaChipSecondary]}>
                          <Text style={styles.metaChipRecurringText}>
                            {formatDistanceKm(opportunity.distanceKm)}
                          </Text>
                        </View>
                      ) : null}
                      {opportunity.isWithinTravelRadius === true ? (
                        <View style={[styles.metaChip, styles.matchChipCity]}>
                          <Text style={[styles.metaChipText, styles.matchChipTextCity]}>
                            No seu raio
                          </Text>
                        </View>
                      ) : null}
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
                        <Text style={styles.metaChipText}>
                          {opportunity.city}/{opportunity.state}
                        </Text>
                      </View>
                      {opportunity.venueType ? (
                        <View style={styles.metaChip}>
                          <Text style={styles.metaChipText}>{opportunity.venueType}</Text>
                        </View>
                      ) : null}
                    </View>

                    <Text style={styles.locationCopy}>{opportunity.location_label}</Text>
                    {opportunity.applicationStatus ? (
                      <>
                        <View style={styles.applicationBadgeWrap}>
                          {opportunity.contractStatus && isDirectInvite ? (
                            <Chip label="Convite recebido" tone="secondary" />
                          ) : opportunity.contractStatus ? (
                            <Chip
                              label={formatContractStatusLabel(opportunity.contractStatus)}
                              tone={mapContractToneToChip(opportunity.contractStatus)}
                            />
                          ) : (
                            <Chip
                              label={formatOpportunityApplicationStatusLabel(opportunity.applicationStatus)}
                              tone="secondary"
                            />
                          )}
                        </View>
                        <View style={styles.cardActionsRow}>
                          <GhostButton
                            icon="forum"
                            label="Abrir conversa"
                            onPress={() =>
                              opportunity.applicationId
                                ? router.push(`/chat/application/${opportunity.applicationId}`)
                                : router.push(`/musician/opportunities/${opportunity.id}`)
                            }
                          />
                          {opportunity.contractStatus === 'pending_confirmation' ? (
                            <GhostButton
                              icon="verified"
                              label={isDirectInvite ? 'Responder convite' : 'Confirmar contratacao'}
                              onPress={() => router.push(`/musician/opportunities/${opportunity.id}`)}
                            />
                          ) : (
                            <GhostButton
                              icon="visibility"
                              label={
                                opportunity.contractStatus === 'confirmed'
                                  ? 'Ver show'
                                  : 'Ver candidatura'
                              }
                              onPress={() => router.push(`/musician/opportunities/${opportunity.id}`)}
                            />
                          )}
                        </View>
                      </>
                    ) : (
                      <GhostButton
                        icon="campaign"
                        label="Ver detalhes"
                        onPress={() => router.push(`/musician/opportunities/${opportunity.id}`)}
                      />
                    )}
                  </View>
                  </GlassCard>
                );
              })
            ) : (
              <EmptyState
                description="Nenhuma vaga combinou com os filtros atuais. Ajuste periodo, regiao ou faixa de cache para ampliar o radar."
                eyebrow="Feed do Musico"
                title="Nenhuma oportunidade combinou com seu recorte"
              />
            )}
          </View>
        </ScrollView>

        <BottomNav accountType="musician" active="home" />
      </View>
    </SafeAreaView>
  );
}

function FilterSection<T extends string>({
  eyebrow,
  onSelect,
  options,
  selectedKey,
  title,
}: {
  eyebrow: string;
  onSelect: (value: T) => void;
  options: Array<{ key: T; label: string }>;
  selectedKey: T;
  title: string;
}) {
  return (
    <View style={styles.filterSection}>
      <Text style={styles.filterSectionEyebrow}>{eyebrow}</Text>
      <Text style={styles.filterSectionTitle}>{title}</Text>
      <View style={styles.filterPillWrap}>
        {options.map((option) => (
          <Pressable
            key={option.key}
            style={({ pressed }) => [
              styles.filterPill,
              selectedKey === option.key && styles.filterPillActive,
              pressed && styles.filterPillPressed,
            ]}
            onPress={() => onSelect(option.key)}>
            <Text
              style={[
                styles.filterPillText,
                selectedKey === option.key && styles.filterPillTextActive,
              ]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function filterMusicianOpportunities(
  opportunities: OpportunityFeedItem[],
  filters: {
    artistCity: string | null;
    artistRadiusKm: number | null;
    artistState: string | null;
    budgetScope: MusicianBudgetScope;
    dateScope: MusicianDateScope;
    distanceScope: MusicianDistanceScope;
    regionScope: MusicianRegionScope;
  },
) {
  const now = new Date();

  return opportunities.filter((opportunity) => {
    const nextOccurrence = getOpportunityNextOccurrenceDate(opportunity, now);
    const matchScope = getOpportunityLocationMatchScope(
      opportunity,
      filters.artistCity,
      filters.artistState,
    );

    if (filters.regionScope === 'city' && matchScope !== 'city') {
      return false;
    }

    if (filters.regionScope === 'state' && !['city', 'state'].includes(matchScope)) {
      return false;
    }

    if (filters.dateScope === 'week' && !isWithinNextDays(nextOccurrence, 7, now)) {
      return false;
    }

    if (filters.dateScope === 'month' && !isWithinNextDays(nextOccurrence, 30, now)) {
      return false;
    }

    if (
      !matchesDistanceScope(
        opportunity,
        filters.distanceScope,
        filters.artistCity,
        filters.artistState,
        filters.artistRadiusKm,
      )
    ) {
      return false;
    }

    return matchesBudgetScope(opportunity.budget_cents, filters.budgetScope);
  });
}

function isWithinNextDays(date: Date, days: number, referenceDate = new Date()) {
  const dayWindowEnd = new Date(referenceDate);
  dayWindowEnd.setDate(dayWindowEnd.getDate() + days);
  dayWindowEnd.setHours(23, 59, 59, 999);
  return date.getTime() <= dayWindowEnd.getTime();
}

function matchesBudgetScope(budgetCents: number, scope: MusicianBudgetScope) {
  if (scope === 'all') {
    return true;
  }

  if (scope === 'budget_up_to_500') {
    return budgetCents <= 50000;
  }

  if (scope === 'budget_500_to_1000') {
    return budgetCents > 50000 && budgetCents <= 100000;
  }

  return budgetCents > 100000;
}

function matchesDistanceScope(
  opportunity: OpportunityFeedItem,
  scope: MusicianDistanceScope,
  artistCity: string | null,
  artistState: string | null,
  artistRadiusKm: number | null,
) {
  if (scope === 'all') {
    return true;
  }

  if (scope === 'within_radius') {
    if (artistRadiusKm !== null && opportunity.distanceKm !== null) {
      return opportunity.distanceKm <= artistRadiusKm;
    }

    return getOpportunityLocationMatchScope(opportunity, artistCity, artistState) === 'city';
  }

  if (scope === 'up_to_25') {
    if (opportunity.distanceKm !== null) {
      return opportunity.distanceKm <= 25;
    }

    return getOpportunityLocationMatchScope(opportunity, artistCity, artistState) === 'city';
  }

  if (opportunity.distanceKm !== null) {
    return opportunity.distanceKm <= 50;
  }

  return getOpportunityLocationMatchScope(opportunity, artistCity, artistState) === 'city';
}

function formatLocationMatchLabel(scope: OpportunityLocationMatchScope) {
  if (scope === 'city') {
    return 'Na sua cidade';
  }

  if (scope === 'state') {
    return 'No seu estado';
  }

  return 'Outras regioes';
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

function OpportunityLoadingCard() {
  return (
    <GlassCard padding={0} style={styles.opportunityCard}>
      <View style={styles.loadingImage} />
      <View style={styles.opportunityContent}>
        <LoadingBlock style={styles.loadingTitle} />
        <LoadingBlock style={styles.loadingTime} />
        <LoadingBlock style={styles.loadingChipRow} />
        <LoadingBlock style={styles.loadingButton} />
      </View>
    </GlassCard>
  );
}

function LoadingBlock({ style }: { style: object }) {
  return <View style={[styles.loadingBlock, style]} />;
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
  filterPanel: {
    gap: spacing.lg,
  },
  filterEyebrow: {
    ...typography.label,
    color: colors.secondary,
  },
  filterTitle: {
    ...typography.sectionTitle,
    color: colors.onSurface,
  },
  filterDescription: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
  },
  filterSection: {
    gap: spacing.sm,
  },
  filterSectionEyebrow: {
    ...typography.label,
    color: colors.secondaryDim,
  },
  filterSectionTitle: {
    ...typography.bodyBold,
    color: colors.onSurface,
  },
  filterPillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterPill: {
    minHeight: 38,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  filterPillActive: {
    backgroundColor: 'rgba(0,238,252,0.14)',
    borderColor: 'rgba(0,238,252,0.24)',
  },
  filterPillPressed: {
    opacity: 0.92,
  },
  filterPillText: {
    ...typography.label,
    color: colors.onSurfaceVariant,
  },
  filterPillTextActive: {
    color: colors.secondary,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  reminderList: {
    gap: spacing.md,
  },
  reminderHeader: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  reminderTitle: {
    ...typography.sectionTitle,
    color: colors.onSurface,
    flex: 1,
  },
  reminderLink: {
    ...typography.label,
    color: colors.secondary,
    textAlign: 'right',
  },
  inlineFilters: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  feed: {
    gap: spacing.lg,
  },
  opportunityCard: {
    overflow: 'hidden',
  },
  opportunityImageWrap: {
    height: 192,
    overflow: 'hidden',
  },
  opportunityImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  opportunityContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  opportunityTitle: {
    ...typography.cardTitle,
    color: colors.onSurface,
  },
  opportunityTime: {
    ...typography.label,
    color: colors.secondary,
    marginTop: -6,
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
  metaChipRecurring: {
    backgroundColor: 'rgba(0,238,252,0.14)',
  },
  metaChipSecondary: {
    backgroundColor: 'rgba(0,238,252,0.14)',
  },
  metaChipRecurringText: {
    ...typography.bodyMedium,
    color: colors.secondary,
  },
  matchChipCity: {
    backgroundColor: colors.primary,
  },
  matchChipState: {
    backgroundColor: 'rgba(0,238,252,0.14)',
  },
  matchChipNational: {
    backgroundColor: colors.surfaceContainerHighest,
  },
  matchChipTextCity: {
    color: colors.onPrimaryFixed,
  },
  matchChipTextState: {
    color: colors.secondary,
  },
  matchChipTextNational: {
    color: colors.onSurfaceVariant,
  },
  locationCopy: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
  },
  applicationBadgeWrap: {
    alignItems: 'flex-start',
  },
  cardActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  urgentBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: 'rgba(167,1,56,0.90)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  urgentDot: {
    width: 7,
    height: 7,
    borderRadius: radii.pill,
    backgroundColor: colors.error,
  },
  urgentLabel: {
    ...typography.label,
    color: '#ffb2b9',
  },
  priceBadge: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  priceBadgeText: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  loadingImage: {
    height: 192,
    backgroundColor: colors.surfaceContainerLowest,
  },
  loadingBlock: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  loadingTitle: {
    height: 28,
    width: '70%',
  },
  loadingTime: {
    height: 18,
    width: '44%',
  },
  loadingChipRow: {
    height: 32,
    width: '100%',
  },
  loadingButton: {
    height: 42,
    width: '100%',
  },
});
