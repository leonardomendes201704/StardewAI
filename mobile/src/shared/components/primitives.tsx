import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

import { colors, radii, shadows, spacing, typography } from '@/src/shared/theme';

type GlassCardProps = ViewProps & {
  padding?: number;
  surface?: 'glass' | 'solid' | 'panel';
};

export function GlassCard({
  children,
  style,
  padding = spacing.lg,
  surface = 'glass',
  ...rest
}: GlassCardProps) {
  const backgroundColor =
    surface === 'panel'
      ? colors.surfaceContainerLow
      : surface === 'solid'
        ? colors.surfaceContainerHigh
        : colors.glass;

  return (
    <View
      style={[
        styles.glassCard,
        {
          backgroundColor,
          borderRadius: radii.lg,
          padding,
        },
        style,
      ]}
      {...rest}>
      {surface === 'glass' ? (
        <BlurView
          intensity={60}
          tint="dark"
          experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          styles.glassBorder,
          { borderRadius: radii.lg, backgroundColor },
        ]}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

type GlowButtonProps = PressableProps & {
  containerStyle?: StyleProp<ViewStyle>;
  label: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
};

export function GlowButton({ label, icon, containerStyle, ...rest }: GlowButtonProps) {
  return (
    <Pressable style={({ pressed }) => [containerStyle, pressed && styles.pressed]} {...rest}>
      <LinearGradient
        colors={[colors.primary, colors.primaryContainer]}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={styles.glowButton}>
        <Text style={styles.glowButtonLabel}>{label}</Text>
        {icon ? <MaterialIcons color={colors.onPrimaryFixed} name={icon} size={20} /> : null}
      </LinearGradient>
    </Pressable>
  );
}

type GhostButtonProps = PressableProps & {
  containerStyle?: StyleProp<ViewStyle>;
  label: string;
  tone?: 'primary' | 'secondary';
  icon?: keyof typeof MaterialIcons.glyphMap;
};

export function GhostButton({
  label,
  tone = 'secondary',
  icon,
  containerStyle,
  ...rest
}: GhostButtonProps) {
  const textColor = tone === 'primary' ? colors.primary : colors.secondary;

  return (
    <Pressable
      style={({ pressed }) => [styles.ghostButton, containerStyle, pressed && styles.pressed]}
      {...rest}>
      {icon ? <MaterialIcons color={textColor} name={icon} size={16} /> : null}
      <Text style={[styles.ghostButtonLabel, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

type ChipProps = {
  label: string;
  active?: boolean;
  tone?: 'primary' | 'secondary' | 'neutral' | 'danger';
};

export function Chip({ label, active = false, tone = 'neutral' }: ChipProps) {
  const palette = {
    primary: {
      bg: active ? colors.primary : 'rgba(243,255,202,0.10)',
      text: active ? colors.onPrimaryFixed : colors.primary,
      border: 'rgba(243,255,202,0.20)',
    },
    secondary: {
      bg: active ? 'rgba(0,238,252,0.14)' : 'rgba(0,238,252,0.10)',
      text: colors.secondary,
      border: 'rgba(0,238,252,0.20)',
    },
    neutral: {
      bg: active ? colors.surfaceContainerHigh : colors.surfaceVariant,
      text: active ? colors.primary : colors.onSurfaceVariant,
      border: 'transparent',
    },
    danger: {
      bg: 'rgba(167,1,56,0.85)',
      text: '#ffb2b9',
      border: 'transparent',
    },
  } as const;

  const current = palette[tone];

  return (
    <View style={[styles.chip, { backgroundColor: current.bg, borderColor: current.border }]}>
      <Text style={[styles.chipLabel, { color: current.text }]}>{label}</Text>
    </View>
  );
}

export function Badge(props: ChipProps) {
  return <Chip {...props} />;
}

type AvatarProps = {
  image?: string;
  size?: number;
  icon?: keyof typeof MaterialIcons.glyphMap;
};

export function Avatar({ image, size = 48, icon = 'person' }: AvatarProps) {
  if (image) {
    return (
      <View style={[styles.avatarFrame, { width: size, height: size, borderRadius: size / 2 }]}>
        {/* eslint-disable-next-line @typescript-eslint/no-require-imports */}
        <View style={StyleSheet.absoluteFill}>
          <ImageUri source={image} style={{ width: size, height: size, borderRadius: size / 2 }} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.avatarFallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <MaterialIcons color={colors.onSurfaceVariant} name={icon} size={size / 2} />
    </View>
  );
}

type InputFieldProps = TextInputProps & {
  containerStyle?: StyleProp<ViewStyle>;
  icon?: keyof typeof MaterialIcons.glyphMap;
};

export function InputField({ icon = 'search', containerStyle, style, ...rest }: InputFieldProps) {
  const multiline = Boolean(rest.multiline);
  const disabled = rest.editable === false;

  return (
    <View
      style={[
        styles.inputShell,
        multiline && styles.inputShellMultiline,
        disabled && styles.inputShellDisabled,
        containerStyle,
      ]}>
      <MaterialIcons
        color={disabled ? colors.outline : colors.outlineVariant}
        name={icon}
        size={18}
        style={styles.inputIcon}
      />
      <TextInput
        placeholderTextColor={colors.outlineVariant}
        style={[styles.input, multiline && styles.inputMultiline, disabled && styles.inputDisabled, style]}
        {...rest}
      />
    </View>
  );
}

type EmptyStateProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function EmptyState({ eyebrow, title, description }: EmptyStateProps) {
  return (
    <GlassCard surface="panel">
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
    </GlassCard>
  );
}

type ImageUriProps = {
  source: string;
  style?: ViewProps['style'];
};

export function ImageUri({ source, style }: ImageUriProps) {
  // Lazy local wrapper keeps imports small in the route files.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Image } = require('react-native');

  return <Image source={{ uri: source }} style={style} />;
}

const styles = StyleSheet.create({
  glassCard: {
    overflow: 'hidden',
    ...shadows.soft,
  },
  glassBorder: {
    borderWidth: 1,
    borderColor: colors.borderGhost,
  },
  content: {
    gap: spacing.md,
  },
  glowButton: {
    minHeight: 56,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    ...shadows.neon,
  },
  glowButtonLabel: {
    ...typography.bodyBold,
    color: colors.onPrimaryFixed,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  ghostButton: {
    minHeight: 42,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(0,238,252,0.18)',
    backgroundColor: 'rgba(0,238,252,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  ghostButtonLabel: {
    ...typography.label,
  },
  chip: {
    minHeight: 32,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipLabel: {
    ...typography.label,
  },
  avatarFrame: {
    overflow: 'hidden',
  },
  avatarFallback: {
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputShell: {
    minHeight: 52,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceContainerLowest,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0,238,252,0.12)',
  },
  inputShellMultiline: {
    alignItems: 'flex-start',
    minHeight: 140,
    paddingVertical: spacing.md,
  },
  inputShellDisabled: {
    backgroundColor: colors.surfaceContainerLow,
    borderColor: 'rgba(118,116,127,0.20)',
  },
  inputIcon: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  input: {
    flex: 1,
    color: colors.onSurface,
    ...typography.body,
  },
  inputMultiline: {
    minHeight: 108,
    textAlignVertical: 'top',
  },
  inputDisabled: {
    color: colors.onSurfaceVariant,
  },
  eyebrow: {
    ...typography.label,
    color: colors.secondary,
  },
  emptyTitle: {
    ...typography.sectionTitle,
    color: colors.onSurface,
  },
  emptyDescription: {
    ...typography.body,
    color: colors.onSurfaceVariant,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
});
