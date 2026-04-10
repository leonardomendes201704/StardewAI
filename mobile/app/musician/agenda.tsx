import { type ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  buildMusicianAvailabilityWindow,
  buildContractOperationalReminders,
  compareContractAgendaItems,
  formatContractAgendaScheduleLabel,
  formatContractStatusLabel,
  getContractTone,
  isContractHistoryItem,
  type ContractAgendaItem,
  type ContractAvailabilityDay,
  useContractAgenda,
} from '@/src/features/contracts/contracts';
import { OperationalReminderCard } from '@/src/features/contracts/operational-reminder-card';
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

const defaultCounterpartImage =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCrt1x9MZ1YV-DOzUUTG9KuJgd7GOkSWSdo8aLxGeNdkKKBVX9agul9JOWv2lyEEBHZR_iqysSY0CCS4acK0sg1yRpUYrcZYrBbhAcbTY63lGvuzyG6oiYZf503WKqF4fVAIAaHXjR1zxps2keXJcWzAs3ZI7avUQOkhELUjUd29OPwFNObgoj4pMTMMVzR4J6eRH2Jxt3bd8CHLmiLsArY8rCjVX6rG_jCvdOwv6S42wNB0bv1FhPvEuAfVCVefpuxPDBodSKxpRxG';

export default function MusicianAgendaScreen() {
  const router = useRouter();
  const agendaQuery = useContractAgenda('musician');
  const contracts = [...(agendaQuery.data ?? [])].sort(compareContractAgendaItems);
  const upcomingContracts = contracts.filter((item) => !isContractHistoryItem(item));
  const historyContracts = contracts.filter((item) => isContractHistoryItem(item));
  const availabilityDays = buildMusicianAvailabilityWindow(contracts);
  const blockedDays = availabilityDays.filter((item) => item.isBlocked);
  const reminders = buildContractOperationalReminders(contracts, 'musician');
  const pendingCount = contracts.filter((item) => item.contract.status === 'pending_confirmation').length;
  const confirmedCount = contracts.filter((item) => item.contract.status === 'confirmed').length;
  const completedCount = contracts.filter((item) => item.contract.status === 'completed').length;
  const cancelledCount = contracts.filter((item) => item.contract.status === 'cancelled').length;

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.screen}>
      <TopBar align="left" title="Sua Agenda" />

      <View style={styles.body}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <GlassCard padding={spacing.xl} surface="panel">
            <Text style={styles.sectionEyebrow}>Operacao do musico</Text>
            <Text style={styles.sectionTitle}>Agenda e disponibilidade</Text>
            <Text style={styles.sectionCopy}>
              Acompanhe o que ainda precisa de confirmacao, os shows ja fechados e o historico operacional.
            </Text>
            <View style={styles.summaryGrid}>
              <SummaryMetric label="Pendentes" value={String(pendingCount)} />
              <SummaryMetric label="Confirmados" value={String(confirmedCount)} />
              <SummaryMetric label="Concluidos" value={String(completedCount)} />
              <SummaryMetric label="Cancelados" value={String(cancelledCount)} />
            </View>
          </GlassCard>

          {agendaQuery.isLoading && !agendaQuery.data ? (
            <>
              <LoadingCard />
              <LoadingCard />
              <LoadingCard />
            </>
          ) : agendaQuery.isError ? (
            <EmptyState
              description={
                agendaQuery.error instanceof Error
                  ? agendaQuery.error.message
                  : 'Nao foi possivel carregar a agenda do Musico.'
              }
              eyebrow="Agenda"
              title="Falha ao abrir shows"
            />
          ) : contracts.length > 0 ? (
            <>
              <AgendaSection
                description="Confirmacoes pendentes e shows proximos aparecem aqui com checklist minimo para voce se preparar."
                eyebrow="Lembretes"
                title="Acoes que pedem resposta">
                {reminders.length > 0 ? (
                  reminders.map((reminder) => (
                    <OperationalReminderCard
                      key={reminder.contractId}
                      reminder={reminder}
                      onOpenChat={() => router.push(`/chat/application/${reminder.applicationId}`)}
                      onOpenDetail={() => router.push(`/musician/opportunities/${reminder.opportunityId}`)}
                    />
                  ))
                ) : (
                  <EmptyState
                    description="Sem alertas operacionais agora. O proximo lembrete aparece quando houver show perto da data ou confirmacao pendente."
                    eyebrow="Lembretes"
                    title="Nenhuma acao imediata"
                  />
                )}
              </AgendaSection>

              <GlassCard padding={spacing.xl} surface="panel">
                <Text style={styles.sectionEyebrow}>Disponibilidade</Text>
                <Text style={styles.sectionTitle}>Datas ocupadas nos proximos 21 dias</Text>
                <Text style={styles.sectionCopy}>
                  Dias com contratacao pendente ou confirmada ficam marcados como bloqueados para o seu calendario.
                </Text>
                <AvailabilityBoard days={availabilityDays} />
                <Text style={styles.availabilityFootnote}>
                  {blockedDays.length > 0
                    ? `${blockedDays.length} data(s) ocupada(s) no horizonte atual.`
                    : 'Nenhuma data bloqueada nos proximos 21 dias.'}
                </Text>
                {blockedDays.slice(0, 4).map((day) => (
                  <Text key={`blocked-${day.key}`} style={styles.availabilityDetail}>
                    {`${day.dayNumber} ${day.monthLabel} - ${day.labels.join(' / ')}`}
                  </Text>
                ))}
              </GlassCard>

              <AgendaSection
                description="Shows que ainda pedem acao, conversa ou acompanhamento direto."
                eyebrow="Proximos shows"
                title="Fluxo ativo">
                {upcomingContracts.length > 0 ? (
                  upcomingContracts.map((item) => (
                    <AgendaContractCard
                      key={item.contract.id}
                      item={item}
                      onOpenChat={() => router.push(`/chat/application/${item.applicationId}`)}
                      onOpenDetail={() => router.push(`/musician/opportunities/${item.opportunity.id}`)}
                      onOpenReview={() => router.push(`/musician/reviews/${item.contract.id}`)}
                    />
                  ))
                ) : (
                  <EmptyState
                    description="Quando um Bar iniciar uma contratacao ou voce confirmar um show, ele aparece aqui."
                    eyebrow="Fluxo ativo"
                    title="Nenhum show em andamento"
                  />
                )}
              </AgendaSection>

              {historyContracts.length > 0 ? (
                <AgendaSection
                  description="Contratos que ja foram concluídos, cancelados ou sairam do ciclo ativo."
                  eyebrow="Historico"
                  title="Linha do tempo recente">
                  {historyContracts.map((item) => (
                    <AgendaContractCard
                      key={item.contract.id}
                      item={item}
                      onOpenChat={() => router.push(`/chat/application/${item.applicationId}`)}
                      onOpenDetail={() => router.push(`/musician/opportunities/${item.opportunity.id}`)}
                      onOpenReview={() => router.push(`/musician/reviews/${item.contract.id}`)}
                    />
                  ))}
                </AgendaSection>
              ) : null}
            </>
          ) : (
            <EmptyState
              description="Quando uma contratacao for aberta pelo Bar, ela aparecera aqui com status, datas ocupadas e atalhos para detalhe e conversa."
              eyebrow="Agenda"
              title="Nenhum show negociado ainda"
            />
          )}
        </ScrollView>

        <BottomNav accountType="musician" active="calendar" />
      </View>
    </SafeAreaView>
  );
}

function AgendaSection({
  children,
  description,
  eyebrow,
  title,
}: {
  children: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <View style={styles.sectionStack}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionCopy}>{description}</Text>
      </View>
      <View style={styles.sectionCards}>{children}</View>
    </View>
  );
}

function AgendaContractCard({
  item,
  onOpenChat,
  onOpenDetail,
  onOpenReview,
}: {
  item: ContractAgendaItem;
  onOpenChat: () => void;
  onOpenDetail: () => void;
  onOpenReview: () => void;
}) {
  const isCompleted = item.contract.status === 'completed';

  return (
    <GlassCard padding={spacing.lg} style={styles.card} surface="panel">
      <View style={styles.cardTop}>
        <ImageUri source={item.counterpartImageUrl ?? defaultCounterpartImage} style={styles.avatar} />
        <View style={styles.cardCopy}>
          <Text style={styles.cardTitle}>{item.counterpartName}</Text>
          {item.counterpartMeta ? <Text style={styles.cardMeta}>{item.counterpartMeta}</Text> : null}
          <Text style={styles.cardHighlight}>{item.opportunity.title}</Text>
          <Text style={styles.cardMeta}>{formatContractAgendaScheduleLabel(item.opportunity)}</Text>
        </View>
      </View>

      <View style={styles.chipsRow}>
        <Chip
          label={formatContractStatusLabel(item.contract.status)}
          tone={mapContractToneToChip(item.contract.status)}
        />
        <Chip label={item.opportunity.location_label} tone="neutral" />
      </View>

      <View style={styles.actionsRow}>
        <GhostButton
          containerStyle={styles.actionButton}
          icon={
            isCompleted
              ? 'star-rate'
              : item.contract.status === 'pending_confirmation'
                ? 'verified'
                : 'visibility'
          }
          label={
            isCompleted
              ? 'Avaliar Bar'
              : item.contract.status === 'pending_confirmation'
                ? 'Confirmar show'
                : 'Ver detalhes'
          }
          onPress={isCompleted ? onOpenReview : onOpenDetail}
        />
        <GhostButton
          containerStyle={styles.actionButton}
          icon={isCompleted ? 'visibility' : 'forum'}
          label={isCompleted ? 'Ver detalhes' : 'Abrir conversa'}
          onPress={isCompleted ? onOpenDetail : onOpenChat}
        />
      </View>
    </GlassCard>
  );
}

function AvailabilityBoard({ days }: { days: ContractAvailabilityDay[] }) {
  const weeks = Array.from({ length: Math.ceil(days.length / 7) }, (_, index) =>
    days.slice(index * 7, index * 7 + 7),
  );

  return (
    <View style={styles.calendarBoard}>
      {weeks.map((week, index) => (
        <View key={`week-${index + 1}`} style={styles.calendarRow}>
          {week.map((day) => (
            <View
              key={day.key}
              style={[styles.calendarCell, day.isBlocked && styles.calendarCellBlocked]}>
              <Text style={[styles.calendarWeekday, day.isBlocked && styles.calendarWeekdayBlocked]}>
                {day.weekdayLabel.replace('.', '')}
              </Text>
              <Text style={[styles.calendarDayNumber, day.isBlocked && styles.calendarDayNumberBlocked]}>
                {day.dayNumber}
              </Text>
              <Text style={[styles.calendarState, day.isBlocked && styles.calendarStateBlocked]}>
                {day.isBlocked ? 'Ocupado' : 'Livre'}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
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
    <GlassCard padding={spacing.lg} style={styles.card} surface="panel">
      <View style={styles.loadingBlock} />
      <View style={[styles.loadingBlock, styles.loadingWide]} />
      <View style={[styles.loadingBlock, styles.loadingAction]} />
    </GlassCard>
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

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  body: {
    flex: 1,
    position: 'relative',
  },
  content: {
    gap: spacing.lg,
    paddingBottom: 132,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  sectionStack: {
    gap: spacing.md,
  },
  sectionHeader: {
    gap: spacing.xs,
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
  sectionCards: {
    gap: spacing.md,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metricCard: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.lg,
    minWidth: '47%',
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
  card: {
    gap: spacing.md,
  },
  cardTop: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  avatar: {
    borderRadius: radii.lg,
    height: 72,
    width: 72,
  },
  cardCopy: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    ...typography.cardTitle,
    color: colors.onSurface,
  },
  cardMeta: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
  },
  cardHighlight: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionButton: {
    minWidth: 152,
  },
  calendarBoard: {
    gap: spacing.sm,
  },
  calendarRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  calendarCell: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHigh,
    borderColor: colors.outlineVariant,
    borderRadius: radii.lg,
    borderWidth: 1,
    flex: 1,
    gap: 2,
    minHeight: 78,
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: spacing.sm,
  },
  calendarCellBlocked: {
    backgroundColor: 'rgba(233,255,78,0.14)',
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.28,
    shadowRadius: 12,
  },
  calendarWeekday: {
    ...typography.label,
    color: colors.onSurfaceVariant,
    textTransform: 'capitalize',
  },
  calendarWeekdayBlocked: {
    color: colors.primary,
  },
  calendarDayNumber: {
    ...typography.bodyBold,
    color: colors.onSurface,
    fontSize: 18,
  },
  calendarDayNumberBlocked: {
    color: colors.primary,
  },
  calendarState: {
    ...typography.label,
    color: colors.onSurfaceVariant,
  },
  calendarStateBlocked: {
    color: colors.primary,
  },
  availabilityFootnote: {
    ...typography.bodyMedium,
    color: colors.onSurface,
  },
  availabilityDetail: {
    ...typography.bodyMedium,
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
