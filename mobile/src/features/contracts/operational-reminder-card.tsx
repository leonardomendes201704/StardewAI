import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import {
  formatContractStatusLabel,
  getContractTone,
  type ContractOperationalReminder,
} from '@/src/features/contracts/contracts';
import { Chip, GhostButton, GlassCard } from '@/src/shared/components';
import { colors, radii, spacing, typography } from '@/src/shared/theme';

export function OperationalReminderCard({
  reminder,
  onOpenChat,
  onOpenDetail,
}: {
  reminder: ContractOperationalReminder;
  onOpenChat: () => void;
  onOpenDetail: () => void;
}) {
  return (
    <GlassCard padding={spacing.lg} style={styles.card} surface="panel">
      <View style={styles.topRow}>
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>{reminder.title}</Text>
          <Text style={styles.title}>{reminder.opportunityTitle}</Text>
          <Text style={styles.meta}>
            Com {reminder.counterpartName}
            {reminder.counterpartMeta ? ` - ${reminder.counterpartMeta}` : ''}
          </Text>
          <Text style={styles.schedule}>{reminder.scheduleLabel}</Text>
        </View>
        <Chip label={reminder.dueLabel} tone={mapReminderTone(reminder.kind)} />
      </View>

      <View style={styles.statusRow}>
        <Chip
          label={formatContractStatusLabel(reminder.contractStatus)}
          tone={mapContractToneToChip(reminder.contractStatus)}
        />
      </View>

      <View style={styles.checklist}>
        {reminder.checklist.map((item) => (
          <View key={`${reminder.contractId}-${item}`} style={styles.checklistItem}>
            <MaterialIcons color={colors.primary} name="check-circle-outline" size={18} />
            <Text style={styles.checklistText}>{item}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actionsRow}>
        <GhostButton
          containerStyle={styles.actionButton}
          icon="visibility"
          label="Abrir detalhes"
          onPress={onOpenDetail}
        />
        <GhostButton
          containerStyle={styles.actionButton}
          icon="forum"
          label="Abrir conversa"
          onPress={onOpenChat}
        />
      </View>
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

function mapReminderTone(kind: ContractOperationalReminder['kind']) {
  if (kind === 'pending_confirmation') {
    return 'secondary' as const;
  }

  if (kind === 'today' || kind === 'upcoming_48h') {
    return 'primary' as const;
  }

  return 'neutral' as const;
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  topRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    ...typography.label,
    color: colors.secondary,
  },
  title: {
    ...typography.cardTitle,
    color: colors.onSurface,
  },
  meta: {
    ...typography.bodyMedium,
    color: colors.onSurface,
  },
  schedule: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
  },
  statusRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  checklist: {
    gap: spacing.sm,
  },
  checklistItem: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  checklistText: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionButton: {
    minWidth: 152,
  },
});
