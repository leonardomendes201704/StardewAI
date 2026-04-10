import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthSession } from '@/src/features/auth/auth-provider';
import { formatInboxTimestamp, useChatInbox } from '@/src/features/chat/chat';
import { BottomNav, EmptyState, GlassCard, ImageUri, TopBar } from '@/src/shared/components';
import { colors, radii, spacing, typography } from '@/src/shared/theme';

const defaultAvatar =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCrt1x9MZ1YV-DOzUUTG9KuJgd7GOkSWSdo8aLxGeNdkKKBVX9agul9JOWv2lyEEBHZR_iqysSY0CCS4acK0sg1yRpUYrcZYrBbhAcbTY63lGvuzyG6oiYZf503WKqF4fVAIAaHXjR1zxps2keXJcWzAs3ZI7avUQOkhELUjUd29OPwFNObgoj4pMTMMVzR4J6eRH2Jxt3bd8CHLmiLsArY8rCjVX6rG_jCvdOwv6S42wNB0bv1FhPvEuAfVCVefpuxPDBodSKxpRxG';

export function ChatInboxScreen() {
  const router = useRouter();
  const { accountType } = useAuthSession();
  const inboxQuery = useChatInbox(accountType);

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.screen}>
      <TopBar centeredBrand location="Mensagens" title="TocaAI" />

      <View style={styles.body}>
        {inboxQuery.isLoading && !inboxQuery.data ? (
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <LoadingThreadCard />
            <LoadingThreadCard />
          </ScrollView>
        ) : inboxQuery.isError ? (
          <View style={styles.contentWrap}>
            <EmptyState
              description={
                inboxQuery.error instanceof Error
                  ? inboxQuery.error.message
                  : 'Nao foi possivel carregar as conversas agora.'
              }
              eyebrow="Erro"
              title="Falha ao abrir mensagens"
            />
          </View>
        ) : (inboxQuery.data ?? []).length > 0 ? (
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {(inboxQuery.data ?? []).map((thread) => (
              <Pressable
                key={thread.threadId}
                onPress={() => router.push(`/chat/application/${thread.applicationId}`)}
                style={({ pressed }) => [pressed && styles.cardPressed]}>
                <GlassCard padding={spacing.lg} style={styles.threadCard} surface="panel">
                  <View style={styles.threadTop}>
                    <ImageUri
                      source={thread.counterpartImageUrl ?? defaultAvatar}
                      style={styles.avatar}
                    />
                    <View style={styles.threadCopy}>
                      <View style={styles.threadHeader}>
                        <Text numberOfLines={1} style={styles.counterpartName}>
                          {thread.counterpartName}
                        </Text>
                        <Text style={styles.timestamp}>{formatInboxTimestamp(thread.lastMessageAt)}</Text>
                      </View>
                      {thread.counterpartMeta ? (
                        <Text numberOfLines={1} style={styles.counterpartMeta}>
                          {thread.counterpartMeta}
                        </Text>
                      ) : null}
                      <Text numberOfLines={1} style={styles.opportunityTitle}>
                        {thread.opportunityTitle}
                      </Text>
                      <Text numberOfLines={1} style={styles.scheduleLabel}>
                        {thread.scheduleLabel}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.previewBlock}>
                    <Text numberOfLines={1} style={styles.contextLabel}>
                      {thread.chatContextLabel}
                    </Text>
                    <Text numberOfLines={2} style={styles.previewText}>
                      {thread.lastMessagePreview}
                    </Text>
                  </View>
                </GlassCard>
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.contentWrap}>
            <EmptyState
              description={
                accountType === 'bar'
                  ? 'Quando um musico se candidatar a uma vaga, a conversa contextual aparecera aqui.'
                  : 'Depois de se candidatar a uma vaga, a conversa com o Bar aparecera aqui.'
              }
              eyebrow="Mensagens"
              title="Nenhuma conversa aberta ainda"
            />
          </View>
        )}

        <BottomNav accountType={accountType ?? 'musician'} active="chat" />
      </View>
    </SafeAreaView>
  );
}

function LoadingThreadCard() {
  return (
    <GlassCard padding={spacing.lg} style={styles.threadCard} surface="panel">
      <View style={styles.threadTop}>
        <View style={[styles.loadingBlock, styles.loadingAvatar]} />
        <View style={styles.threadCopy}>
          <View style={[styles.loadingBlock, styles.loadingName]} />
          <View style={[styles.loadingBlock, styles.loadingMeta]} />
          <View style={[styles.loadingBlock, styles.loadingLine]} />
        </View>
      </View>
      <View style={[styles.loadingBlock, styles.loadingPreview]} />
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
    position: 'relative',
  },
  content: {
    gap: spacing.md,
    paddingBottom: 132,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  contentWrap: {
    flex: 1,
    paddingBottom: 132,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  threadCard: {
    gap: spacing.md,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  threadTop: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  avatar: {
    borderRadius: radii.lg,
    height: 68,
    width: 68,
  },
  threadCopy: {
    flex: 1,
    gap: 4,
  },
  threadHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  counterpartName: {
    ...typography.cardTitle,
    color: colors.onSurface,
    flex: 1,
  },
  timestamp: {
    ...typography.label,
    color: colors.secondary,
  },
  counterpartMeta: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
  },
  opportunityTitle: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  scheduleLabel: {
    ...typography.bodyMedium,
    color: colors.secondary,
  },
  previewBlock: {
    gap: spacing.xs,
  },
  contextLabel: {
    ...typography.label,
    color: colors.onSurfaceVariant,
  },
  previewText: {
    ...typography.body,
    color: colors.onSurface,
  },
  loadingBlock: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  loadingAvatar: {
    borderRadius: radii.lg,
    height: 68,
    width: 68,
  },
  loadingName: {
    height: 22,
    width: '56%',
  },
  loadingMeta: {
    height: 16,
    width: '42%',
  },
  loadingLine: {
    height: 16,
    width: '78%',
  },
  loadingPreview: {
    height: 44,
    width: '100%',
  },
});
