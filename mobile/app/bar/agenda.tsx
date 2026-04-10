import { type ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  buildContractOperationalReminders,
  compareContractAgendaItems,
  formatContractAgendaScheduleLabel,
  formatContractStatusLabel,
  getContractTone,
  isContractHistoryItem,
  type ContractAgendaItem,
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

export default function BarAgendaScreen() {
  const router = useRouter();
  const agendaQuery = useContractAgenda('bar');
  const contracts = [...(agendaQuery.data ?? [])].sort(compareContractAgendaItems);
  const upcomingContracts = contracts.filter((item) => !isContractHistoryItem(item));
  const historyContracts = contracts.filter((item) => isContractHistoryItem(item));
  const reminders = buildContractOperationalReminders(contracts, 'bar');
  const pendingCount = contracts.filter((item) => item.contract.status === 'pending_confirmation').length;
  const confirmedCount = contracts.filter((item) => item.contract.status === 'confirmed').length;
  const completedCount = contracts.filter((item) => item.contract.status === 'completed').length;
  const cancelledCount = contracts.filter((item) => item.contract.status === 'cancelled').length;

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.screen}>
      <TopBar centeredBrand location="Agenda do Bar" title="TocaAI" />

      <View style={styles.body}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <GlassCard padding={spacing.xl} surface="panel">
            <Text style={styles.sectionEyebrow}>Operacao da casa</Text>
            <Text style={styles.sectionTitle}>Agenda de contratacoes</Text>
            <Text style={styles.sectionCopy}>
              Veja o que ainda esta em aberto, o que ja virou show confirmado e o historico operacional recente.
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
            </>
          ) : agendaQuery.isError ? (
            <EmptyState
              description={
                agendaQuery.error instanceof Error
                  ? agendaQuery.error.message
                  : 'Nao foi possivel carregar a agenda do Bar.'
              }
              eyebrow="Agenda"
              title="Falha ao abrir contratacoes"
            />
          ) : contracts.length > 0 ? (
            <>
              <AgendaSection
                description="Confirmacoes pendentes e shows proximos aparecem aqui com checklist minimo para a operacao."
                eyebrow="Lembretes"
                title="Acoes que pedem resposta">
                {reminders.length > 0 ? (
                  reminders.map((reminder) => (
                    <OperationalReminderCard
                      key={reminder.contractId}
                      reminder={reminder}
                      onOpenChat={() => router.push(`/chat/application/${reminder.applicationId}`)}
                      onOpenDetail={() => router.push(`/bar/candidate/${reminder.applicationId}`)}
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

              <AgendaSection
                description="Contratacoes que ainda pedem acompanhamento imediato ou conversa ativa."
                eyebrow="Fluxo ativo"
                title="Proximos shows">
                {upcomingContracts.length > 0 ? (
                  upcomingContracts.map((item) => (
                    <AgendaContractCard
                      key={item.contract.id}
                      item={item}
                      onOpenChat={() => router.push(`/chat/application/${item.applicationId}`)}
                      onOpenDetail={() => router.push(`/bar/candidate/${item.applicationId}`)}
                      onOpenReview={() => router.push(`/bar/reviews/${item.contract.id}`)}
                    />
                  ))
                ) : (
                  <EmptyState
                    description="Assim que uma contratacao entrar em andamento, ela aparecera aqui com os atalhos rapidos."
                    eyebrow="Fluxo ativo"
                    title="Nenhum show em andamento"
                  />
                )}
              </AgendaSection>

              {historyContracts.length > 0 ? (
                <AgendaSection
                  description="Linha do tempo de shows concluidos ou contratos que sairam do fluxo operacional."
                  eyebrow="Historico"
                  title="Movimentacoes recentes">
                  {historyContracts.map((item) => (
                    <AgendaContractCard
                      key={item.contract.id}
                      item={item}
                      onOpenChat={() => router.push(`/chat/application/${item.applicationId}`)}
                      onOpenDetail={() => router.push(`/bar/candidate/${item.applicationId}`)}
                      onOpenReview={() => router.push(`/bar/reviews/${item.contract.id}`)}
                    />
                  ))}
                </AgendaSection>
              ) : null}
            </>
          ) : (
            <EmptyState
              description="Assim que um candidato for selecionado para contratacao, ele aparecera aqui com status e atalhos rapidos."
              eyebrow="Agenda"
              title="Nenhuma contratacao ainda"
            />
          )}
        </ScrollView>

        <BottomNav accountType="bar" active="calendar" />
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
          icon={isCompleted ? 'star-rate' : 'visibility'}
          label={isCompleted ? 'Avaliar musico' : 'Ver contratacao'}
          onPress={isCompleted ? onOpenReview : onOpenDetail}
        />
        <GhostButton
          containerStyle={styles.actionButton}
          icon={isCompleted ? 'visibility' : 'forum'}
          label={isCompleted ? 'Ver contratacao' : 'Conversar'}
          onPress={isCompleted ? onOpenDetail : onOpenChat}
        />
      </View>
    </GlassCard>
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
