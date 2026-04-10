import { MaterialIcons } from '@expo/vector-icons';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  GlassCard,
  GhostButton,
  GlowButton,
  InputField,
} from '@/src/shared/components';
import { colors, radii, spacing, typography } from '@/src/shared/theme';

export type ContractRescheduleFormState = {
  durationHours: string;
  eventDate: string;
  locationLabel: string;
  reason: string;
  startTime: string;
};

export function CancelContractModal({
  description,
  onClose,
  onReasonChange,
  onSubmit,
  pending,
  reason,
  submitLabel,
  title,
  visible,
}: {
  description: string;
  onClose: () => void;
  onReasonChange: (value: string) => void;
  onSubmit: () => void;
  pending: boolean;
  reason: string;
  submitLabel: string;
  title: string;
  visible: boolean;
}) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.backdrop}>
        <Pressable onPress={onClose} style={StyleSheet.absoluteFill} />
        <View style={styles.modalWrap}>
          <GlassCard padding={spacing.xl} style={styles.modalCard} surface="panel">
            <View style={styles.headerRow}>
              <View style={styles.headerCopy}>
                <Text style={styles.eyebrow}>Cancelamento</Text>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.description}>{description}</Text>
              </View>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
                <MaterialIcons color={colors.onSurface} name="close" size={20} />
              </Pressable>
            </View>

            <InputField
              icon="edit-note"
              multiline
              onChangeText={onReasonChange}
              placeholder="Descreva o motivo do cancelamento para manter o historico claro para os dois lados."
              value={reason}
            />

            <View style={styles.actionsRow}>
              <GhostButton containerStyle={styles.actionButton} label="Fechar" onPress={onClose} />
              <GlowButton
                containerStyle={styles.actionButton}
                icon="block"
                label={pending ? 'Salvando motivo' : submitLabel}
                onPress={onSubmit}
              />
            </View>
          </GlassCard>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

export function RescheduleContractModal({
  currentScheduleLabel,
  description,
  form,
  onChange,
  onClose,
  onSubmit,
  pending,
  submitLabel,
  title,
  visible,
}: {
  currentScheduleLabel: string;
  description: string;
  form: ContractRescheduleFormState;
  onChange: (patch: Partial<ContractRescheduleFormState>) => void;
  onClose: () => void;
  onSubmit: () => void;
  pending: boolean;
  submitLabel: string;
  title: string;
  visible: boolean;
}) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.backdrop}>
        <Pressable onPress={onClose} style={StyleSheet.absoluteFill} />
        <View style={styles.modalWrap}>
          <GlassCard padding={spacing.xl} style={styles.modalCard} surface="panel">
            <View style={styles.headerRow}>
              <View style={styles.headerCopy}>
                <Text style={styles.eyebrow}>Remarcacao</Text>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.description}>{description}</Text>
              </View>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
                <MaterialIcons color={colors.onSurface} name="close" size={20} />
              </Pressable>
            </View>

            <View style={styles.currentScheduleShell}>
              <Text style={styles.currentScheduleLabel}>Agenda atual</Text>
              <Text style={styles.currentScheduleValue}>{currentScheduleLabel}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.formStack} showsVerticalScrollIndicator={false}>
              <View style={styles.inlineGrid}>
                <InputField
                  containerStyle={styles.gridField}
                  icon="event"
                  keyboardType="number-pad"
                  onChangeText={(value) => onChange({ eventDate: value })}
                  placeholder="DD/MM/AAAA"
                  value={form.eventDate}
                />
                <InputField
                  containerStyle={styles.gridField}
                  icon="schedule"
                  keyboardType="number-pad"
                  onChangeText={(value) => onChange({ startTime: value })}
                  placeholder="HH:MM"
                  value={form.startTime}
                />
              </View>

              <View style={styles.inlineGrid}>
                <InputField
                  containerStyle={styles.gridField}
                  icon="timer"
                  keyboardType="number-pad"
                  onChangeText={(value) => onChange({ durationHours: value })}
                  placeholder="Duracao em horas"
                  value={form.durationHours}
                />
                <InputField
                  containerStyle={styles.gridField}
                  icon="place"
                  onChangeText={(value) => onChange({ locationLabel: value })}
                  placeholder="Referencia do local"
                  value={form.locationLabel}
                />
              </View>

              <InputField
                icon="edit-calendar"
                multiline
                onChangeText={(value) => onChange({ reason: value })}
                placeholder="Explique por que a agenda foi ajustada para manter historico visivel entre Bar e Musico."
                value={form.reason}
              />
            </ScrollView>

            <View style={styles.actionsRow}>
              <GhostButton containerStyle={styles.actionButton} label="Fechar" onPress={onClose} />
              <GlowButton
                containerStyle={styles.actionButton}
                icon="event-repeat"
                label={pending ? 'Salvando remarcacao' : submitLabel}
                onPress={onSubmit}
              />
            </View>
          </GlassCard>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(5,5,9,0.72)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalWrap: {
    justifyContent: 'center',
  },
  modalCard: {
    maxHeight: '88%',
  },
  headerRow: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  eyebrow: {
    ...typography.label,
    color: colors.secondary,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.onSurface,
  },
  description: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.pill,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  currentScheduleShell: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.lg,
    gap: spacing.xs,
    padding: spacing.md,
  },
  currentScheduleLabel: {
    ...typography.label,
    color: colors.onSurfaceVariant,
  },
  currentScheduleValue: {
    ...typography.bodyBold,
    color: colors.onSurface,
  },
  formStack: {
    gap: spacing.md,
  },
  inlineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  gridField: {
    flex: 1,
    minWidth: 148,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    minWidth: 144,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
});
