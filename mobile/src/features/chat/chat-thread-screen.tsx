import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthSession } from '@/src/features/auth/auth-provider';
import {
  formatDateTimeLabel,
  useChatThread,
  useSendChatMessage,
} from '@/src/features/chat/chat';
import {
  BottomNav,
  EmptyState,
  GlassCard,
  GlowButton,
  ImageUri,
  InputField,
  TopBar,
  getBottomNavStickyActionOffset,
} from '@/src/shared/components';
import { colors, radii, spacing, typography } from '@/src/shared/theme';

const defaultAvatar =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCrt1x9MZ1YV-DOzUUTG9KuJgd7GOkSWSdo8aLxGeNdkKKBVX9agul9JOWv2lyEEBHZR_iqysSY0CCS4acK0sg1yRpUYrcZYrBbhAcbTY63lGvuzyG6oiYZf503WKqF4fVAIAaHXjR1zxps2keXJcWzAs3ZI7avUQOkhELUjUd29OPwFNObgoj4pMTMMVzR4J6eRH2Jxt3bd8CHLmiLsArY8rCjVX6rG_jCvdOwv6S42wNB0bv1FhPvEuAfVCVefpuxPDBodSKxpRxG';

export function ChatThreadScreen({ applicationId }: { applicationId?: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const stickyActionBottom = getBottomNavStickyActionOffset(insets.bottom);
  const { accountType } = useAuthSession();
  const detailQuery = useChatThread(applicationId, accountType);
  const sendMessageMutation = useSendChatMessage(applicationId);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSendMessage() {
    setErrorMessage(null);

    try {
      await sendMessageMutation.mutateAsync(message);
      setMessage('');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Nao foi possivel enviar a mensagem.',
      );
    }
  }

  if (!applicationId) {
    return (
      <SafeAreaView edges={['left', 'right']} style={styles.screen}>
        <TopBar leftIcon="arrow-back" onLeftPress={() => router.back()} title="Conversa" />
        <View style={styles.body}>
          <View style={styles.contentWrap}>
            <EmptyState
              description="Volte para a lista de conversas e abra novamente a candidatura correta."
              eyebrow="Mensagens"
              title="Conversa nao identificada"
            />
          </View>
          <BottomNav accountType={accountType ?? 'musician'} active="chat" />
        </View>
      </SafeAreaView>
    );
  }

  if (detailQuery.isLoading && !detailQuery.data) {
    return (
      <SafeAreaView edges={['left', 'right']} style={styles.screen}>
        <TopBar leftIcon="arrow-back" onLeftPress={() => router.back()} title="Conversa" />
        <View style={styles.body}>
          <ScrollView contentContainerStyle={styles.content} scrollEnabled={false}>
            <LoadingHeader />
            <LoadingBubble align="left" />
            <LoadingBubble align="right" />
          </ScrollView>
          <BottomNav accountType={accountType ?? 'musician'} active="chat" />
        </View>
      </SafeAreaView>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <SafeAreaView edges={['left', 'right']} style={styles.screen}>
        <TopBar leftIcon="arrow-back" onLeftPress={() => router.back()} title="Conversa" />
        <View style={styles.body}>
          <View style={styles.contentWrap}>
            <EmptyState
              description={
                detailQuery.error instanceof Error
                  ? detailQuery.error.message
                  : 'Nao foi possivel abrir a conversa desta candidatura.'
              }
              eyebrow="Erro"
              title="Falha ao abrir conversa"
            />
          </View>
          <BottomNav accountType={accountType ?? 'musician'} active="chat" />
        </View>
      </SafeAreaView>
    );
  }

  const detail = detailQuery.data;

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.screen}>
      <TopBar leftIcon="arrow-back" onLeftPress={() => router.back()} title="Conversa" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.body}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: stickyActionBottom + 188 }]}
          showsVerticalScrollIndicator={false}>
          <GlassCard padding={spacing.lg} style={styles.headerCard} surface="panel">
            <View style={styles.headerTop}>
              <ImageUri
                source={detail.counterpartImageUrl ?? defaultAvatar}
                style={styles.avatar}
              />
              <View style={styles.headerCopy}>
                <Text style={styles.counterpartName}>{detail.counterpartName}</Text>
                {detail.counterpartMeta ? (
                  <Text style={styles.counterpartMeta}>{detail.counterpartMeta}</Text>
                ) : null}
                <Text style={styles.opportunityTitle}>{detail.opportunityTitle}</Text>
                <Text style={styles.scheduleLabel}>{detail.scheduleLabel}</Text>
              </View>
            </View>

            <View style={styles.contextRow}>
              <View style={styles.contextPill}>
                <MaterialIcons color={colors.primary} name="forum" size={16} />
                <Text style={styles.contextPillText}>{detail.statusLabel}</Text>
              </View>
              <Text style={styles.contextText}>{detail.chatContextLabel}</Text>
            </View>
          </GlassCard>

          {detail.messages.length > 0 ? (
            <View style={styles.messageList}>
              {detail.messages.map((chatMessage) => (
                <View
                  key={chatMessage.id}
                  style={[
                    styles.messageWrap,
                    chatMessage.isOwn ? styles.messageWrapOwn : styles.messageWrapOther,
                  ]}>
                  <View
                    style={[
                      styles.messageBubble,
                      chatMessage.isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther,
                    ]}>
                    <Text
                      style={[
                        styles.messageText,
                        chatMessage.isOwn ? styles.messageTextOwn : styles.messageTextOther,
                      ]}>
                      {chatMessage.body}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.messageTime,
                      chatMessage.isOwn ? styles.messageTimeOwn : styles.messageTimeOther,
                    ]}>
                    {formatDateTimeLabel(chatMessage.createdAt)}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <GlassCard padding={spacing.xl} surface="panel">
              <Text style={styles.emptyConversationTitle}>Conversa pronta para comecar</Text>
              <Text style={styles.emptyConversationText}>
                Este canal foi aberto a partir da candidatura. Use o chat para alinhar detalhes do show,
                estrutura e disponibilidade.
              </Text>
            </GlassCard>
          )}
        </ScrollView>

        <View style={[styles.composerWrap, { bottom: stickyActionBottom }]}>
          {(errorMessage || sendMessageMutation.isError) && (
            <GlassCard padding={spacing.md} style={styles.feedbackCard} surface="panel">
              <Text style={styles.errorText}>
                {errorMessage ||
                  (sendMessageMutation.error instanceof Error
                    ? sendMessageMutation.error.message
                    : 'Nao foi possivel enviar a mensagem.')}
              </Text>
            </GlassCard>
          )}

          <GlassCard padding={spacing.md} style={styles.composerCard} surface="panel">
            <InputField
              containerStyle={styles.inputWrap}
              icon="chat"
              multiline
              onChangeText={setMessage}
              placeholder="Escreva uma mensagem sobre esta vaga..."
              style={styles.input}
              value={message}
            />
            <GlowButton
              containerStyle={styles.sendButton}
              disabled={sendMessageMutation.isPending || message.trim().length === 0}
              icon="send"
              label={sendMessageMutation.isPending ? 'Enviando' : 'Enviar'}
              onPress={() => void handleSendMessage()}
            />
          </GlassCard>
        </View>

        <BottomNav accountType={accountType ?? 'musician'} active="chat" />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function LoadingHeader() {
  return (
    <GlassCard padding={spacing.lg} style={styles.headerCard} surface="panel">
      <View style={styles.headerTop}>
        <View style={[styles.loadingBlock, styles.loadingAvatar]} />
        <View style={styles.headerCopy}>
          <View style={[styles.loadingBlock, styles.loadingName]} />
          <View style={[styles.loadingBlock, styles.loadingMeta]} />
          <View style={[styles.loadingBlock, styles.loadingLine]} />
        </View>
      </View>
    </GlassCard>
  );
}

function LoadingBubble({ align }: { align: 'left' | 'right' }) {
  return (
    <View style={[styles.messageWrap, align === 'right' ? styles.messageWrapOwn : styles.messageWrapOther]}>
      <View style={[styles.loadingBlock, styles.loadingBubble, align === 'right' && styles.loadingBubbleOwn]} />
    </View>
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
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  contentWrap: {
    flex: 1,
    paddingBottom: 132,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  headerCard: {
    gap: spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  avatar: {
    borderRadius: radii.lg,
    height: 72,
    width: 72,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  counterpartName: {
    ...typography.cardTitle,
    color: colors.onSurface,
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
  contextRow: {
    gap: spacing.sm,
  },
  contextPill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(243,255,202,0.12)',
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  contextPillText: {
    ...typography.label,
    color: colors.primary,
  },
  contextText: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
  },
  messageList: {
    gap: spacing.md,
  },
  messageWrap: {
    gap: spacing.xs,
    maxWidth: '88%',
  },
  messageWrapOwn: {
    alignSelf: 'flex-end',
  },
  messageWrapOther: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  messageBubbleOwn: {
    backgroundColor: colors.primary,
  },
  messageBubbleOther: {
    backgroundColor: colors.surfaceContainerHigh,
  },
  messageText: {
    ...typography.body,
  },
  messageTextOwn: {
    color: colors.onPrimaryFixed,
  },
  messageTextOther: {
    color: colors.onSurface,
  },
  messageTime: {
    ...typography.label,
  },
  messageTimeOwn: {
    color: colors.primary,
    textAlign: 'right',
  },
  messageTimeOther: {
    color: colors.onSurfaceVariant,
  },
  emptyConversationTitle: {
    ...typography.bodyBold,
    color: colors.onSurface,
  },
  emptyConversationText: {
    ...typography.body,
    color: colors.onSurfaceVariant,
  },
  composerWrap: {
    gap: spacing.sm,
    left: spacing.lg,
    position: 'absolute',
    right: spacing.lg,
  },
  composerCard: {
    gap: spacing.md,
  },
  inputWrap: {
    minHeight: 92,
  },
  input: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  sendButton: {
    width: '100%',
  },
  feedbackCard: {
    gap: spacing.sm,
  },
  errorText: {
    ...typography.bodyMedium,
    color: '#ffb2b9',
  },
  loadingBlock: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  loadingAvatar: {
    borderRadius: radii.lg,
    height: 72,
    width: 72,
  },
  loadingName: {
    height: 22,
    width: '52%',
  },
  loadingMeta: {
    height: 16,
    width: '40%',
  },
  loadingLine: {
    height: 18,
    width: '76%',
  },
  loadingBubble: {
    height: 78,
    width: 240,
  },
  loadingBubbleOwn: {
    width: 180,
  },
});
