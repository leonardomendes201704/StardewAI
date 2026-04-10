import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  DEFAULT_ACCOUNT_NOTIFICATION_PREFERENCES,
  useAccountNotificationPreferences,
  useUpdateAccountNotificationPreferences,
} from '@/src/features/notifications/notifications';
import { usePushNotifications } from '@/src/features/notifications/notifications-provider';
import { Badge, GhostButton, GlassCard } from '@/src/shared/components';
import { colors, radii, spacing, typography } from '@/src/shared/theme';

type NotificationPreferencesCardProps = {
  accountType: 'bar' | 'musician';
};

export function NotificationPreferencesCard({
  accountType,
}: NotificationPreferencesCardProps) {
  const preferencesQuery = useAccountNotificationPreferences();
  const updatePreferences = useUpdateAccountNotificationPreferences();
  const {
    clearTokenSyncError,
    expoPushToken,
    isRegistering,
    isSupported,
    lastTokenSyncAt,
    permissionStatus,
    projectId,
    requestPushActivation,
    syncPushRegistration,
    tokenSyncError,
  } = usePushNotifications();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const preferences = preferencesQuery.data ?? DEFAULT_ACCOUNT_NOTIFICATION_PREFERENCES;

  async function handleTogglePushEnabled(nextValue: boolean) {
    setFeedback(null);
    setErrorMessage(null);
    clearTokenSyncError();

    try {
      await updatePreferences.mutateAsync({ pushEnabled: nextValue });

      if (nextValue) {
        const activated = await requestPushActivation();
        setFeedback(
          activated
            ? 'Push ativado e token sincronizado neste dispositivo.'
            : 'Preferencia salva. Falta conceder permissao ou concluir a sincronizacao do token.',
        );
        return;
      }

      setFeedback('As notificacoes push foram pausadas para esta conta.');
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Nao foi possivel atualizar a preferencia principal de push.',
      );
    }
  }

  async function handleTogglePreference(
    key:
      | 'notifyChatMessage'
      | 'notifyContractUpdate'
      | 'notifyDirectInvite'
      | 'notifyNewApplication'
      | 'notifyPaymentUpdate',
    nextValue: boolean,
  ) {
    setFeedback(null);
    setErrorMessage(null);

    try {
      await updatePreferences.mutateAsync({
        [key]: nextValue,
      });
      setFeedback('Preferencias de notificacao atualizadas.');
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Nao foi possivel salvar esta preferencia de notificacao.',
      );
    }
  }

  async function handleSyncToken() {
    setFeedback(null);
    setErrorMessage(null);
    clearTokenSyncError();

    try {
      const synced = await syncPushRegistration();
      setFeedback(
        synced
          ? 'Token push sincronizado com sucesso neste dispositivo.'
          : 'Nao foi possivel concluir a sincronizacao do token push.',
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Nao foi possivel sincronizar o token push neste dispositivo.',
      );
    }
  }

  const preferenceRows =
    accountType === 'bar'
      ? [
          {
            description: 'Quando um musico se candidatar a uma vaga sua.',
            key: 'notifyNewApplication' as const,
            title: 'Novas candidaturas',
            value: preferences.notifyNewApplication,
          },
          {
            description: 'Quando houver nova mensagem em uma conversa ativa.',
            key: 'notifyChatMessage' as const,
            title: 'Mensagens do chat',
            value: preferences.notifyChatMessage,
          },
          {
            description: 'Quando um artista confirmar um show ou houver mudanca operacional.',
            key: 'notifyContractUpdate' as const,
            title: 'Contratacoes e confirmacoes',
            value: preferences.notifyContractUpdate,
          },
          {
            description: 'Quando uma ocorrencia financeira mudar de estado na plataforma.',
            key: 'notifyPaymentUpdate' as const,
            title: 'Pagamentos',
            value: preferences.notifyPaymentUpdate,
          },
        ]
      : [
          {
            description: 'Quando um Bar enviar um convite direto para voce.',
            key: 'notifyDirectInvite' as const,
            title: 'Convites diretos',
            value: preferences.notifyDirectInvite,
          },
          {
            description: 'Quando houver nova mensagem em uma conversa ativa.',
            key: 'notifyChatMessage' as const,
            title: 'Mensagens do chat',
            value: preferences.notifyChatMessage,
          },
          {
            description: 'Quando um show mudar de confirmacao, remarcacao ou cancelamento.',
            key: 'notifyContractUpdate' as const,
            title: 'Contratacoes e confirmacoes',
            value: preferences.notifyContractUpdate,
          },
          {
            description: 'Quando o pagamento ou o repasse do show mudar de estado.',
            key: 'notifyPaymentUpdate' as const,
            title: 'Pagamentos e repasses',
            value: preferences.notifyPaymentUpdate,
          },
        ];

  return (
    <GlassCard padding={spacing.xl} style={styles.card} surface="panel">
      <Text style={styles.eyebrow}>Notificacoes push</Text>
      <Text style={styles.title}>
        Permissoes do dispositivo e eventos do marketplace que merecem chegar fora do app.
      </Text>

      <View style={styles.statusWrap}>
        <Badge
          active={preferences.pushEnabled}
          label={preferences.pushEnabled ? 'Push ativo' : 'Push pausado'}
          tone={preferences.pushEnabled ? 'primary' : 'neutral'}
        />
        <Badge
          active={permissionStatus === 'granted'}
          label={formatPermissionStatusLabel(permissionStatus)}
          tone={permissionStatus === 'granted' ? 'secondary' : 'neutral'}
        />
        <Badge
          active={Boolean(expoPushToken)}
          label={expoPushToken ? 'Token sincronizado' : 'Token pendente'}
          tone={expoPushToken ? 'secondary' : 'neutral'}
        />
      </View>

      <View style={styles.metaWrap}>
        <MetaLine
          label="Dispositivo"
          value={isSupported ? 'Apto para push' : 'Push indisponivel neste ambiente'}
        />
        <MetaLine
          label="Ultima sincronizacao"
          value={lastTokenSyncAt ? formatDateTime(lastTokenSyncAt) : 'Ainda nao sincronizado'}
        />
        <MetaLine
          label="Projeto Expo"
          value={projectId ? projectId : 'EXPO_PUBLIC_EXPO_PROJECT_ID nao configurado'}
        />
      </View>

      {preferencesQuery.isLoading ? (
        <Text style={styles.helperText}>Carregando preferencias de notificacao...</Text>
      ) : null}

      {preferencesQuery.isError ? (
        <Text style={styles.errorText}>{preferencesQuery.error.message}</Text>
      ) : null}

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      {tokenSyncError ? <Text style={styles.errorText}>{tokenSyncError}</Text> : null}
      {feedback ? <Text style={styles.feedbackText}>{feedback}</Text> : null}

      <PreferenceRow
        description="Liga ou pausa todos os pushes deste perfil, sem mexer nas preferencias individuais."
        disabled={updatePreferences.isPending || isRegistering}
        onPress={() => void handleTogglePushEnabled(!preferences.pushEnabled)}
        title="Receber notificacoes push"
        value={preferences.pushEnabled}
      />

      <View style={styles.preferenceGroup}>
        {preferenceRows.map((item) => (
          <PreferenceRow
            description={item.description}
            disabled={!preferences.pushEnabled || updatePreferences.isPending}
            key={item.key}
            onPress={() => void handleTogglePreference(item.key, !item.value)}
            title={item.title}
            value={item.value}
          />
        ))}
      </View>

      <View style={styles.actionsRow}>
        <GhostButton
          icon={permissionStatus === 'granted' ? 'sync' : 'notifications-active'}
          label={
            isRegistering
              ? permissionStatus === 'granted'
                ? 'Sincronizando token'
                : 'Ativando push'
              : permissionStatus === 'granted'
                ? 'Sincronizar token'
                : 'Ativar no dispositivo'
          }
          onPress={() =>
            void (permissionStatus === 'granted' ? handleSyncToken() : requestPushActivation())
          }
        />
      </View>

      <Text style={styles.footerText}>
        O app ja trata recebimento em foreground e toque em notificacao para abrir a rota certa.
      </Text>
    </GlassCard>
  );
}

function PreferenceRow({
  description,
  disabled,
  onPress,
  title,
  value,
}: {
  description: string;
  disabled?: boolean;
  onPress: () => void;
  title: string;
  value: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.preferenceRow,
        disabled && styles.preferenceRowDisabled,
        pressed && !disabled && styles.preferenceRowPressed,
      ]}>
      <View style={styles.preferenceCopy}>
        <Text style={styles.preferenceTitle}>{title}</Text>
        <Text style={styles.preferenceDescription}>{description}</Text>
      </View>

      <View style={[styles.preferenceToggle, value && styles.preferenceToggleActive]}>
        <MaterialIcons
          color={value ? colors.onPrimaryFixed : colors.outline}
          name={value ? 'notifications-active' : 'notifications-off'}
          size={18}
        />
      </View>
    </Pressable>
  );
}

function MetaLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaLine}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function formatPermissionStatusLabel(value: string) {
  switch (value) {
    case 'granted':
      return 'Permissao concedida';
    case 'denied':
      return 'Permissao negada';
    case 'unsupported':
      return 'Push indisponivel';
    case 'undetermined':
    default:
      return 'Permissao pendente';
  }
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  eyebrow: {
    ...typography.label,
    color: colors.secondary,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.onSurface,
  },
  statusWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metaWrap: {
    gap: spacing.sm,
  },
  metaLine: {
    gap: 4,
  },
  metaLabel: {
    ...typography.label,
    color: colors.onSurfaceVariant,
  },
  metaValue: {
    ...typography.bodyMedium,
    color: colors.onSurface,
  },
  helperText: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
  },
  errorText: {
    ...typography.bodyMedium,
    color: '#ffb2b9',
  },
  feedbackText: {
    ...typography.bodyMedium,
    color: colors.secondary,
  },
  preferenceGroup: {
    gap: spacing.sm,
  },
  preferenceRow: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.borderGhost,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  preferenceRowDisabled: {
    opacity: 0.55,
  },
  preferenceRowPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  preferenceCopy: {
    flex: 1,
    gap: 4,
  },
  preferenceTitle: {
    ...typography.bodyBold,
    color: colors.onSurface,
  },
  preferenceDescription: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
  },
  preferenceToggle: {
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    borderRadius: radii.pill,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  preferenceToggleActive: {
    backgroundColor: colors.primary,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  footerText: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
  },
});
