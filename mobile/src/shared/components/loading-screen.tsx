import { LinearGradient } from 'expo-linear-gradient';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';

import { onboardingBackground } from '@/src/shared/data/prototype';
import { colors, radii, spacing, typography } from '@/src/shared/theme';

type LoadingScreenProps = {
  eyebrow: string;
  subtitle: string;
  title: string;
};

export function LoadingScreen({ eyebrow, subtitle, title }: LoadingScreenProps) {
  return (
    <View style={styles.container}>
      <ImageBackground source={{ uri: onboardingBackground }} style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['rgba(13,13,22,0.98)', 'rgba(13,13,22,0.70)', 'rgba(13,13,22,0.98)']}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />
      </ImageBackground>

      <View style={styles.content}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <View pointerEvents="none" style={styles.cyanGlow} />
      <View pointerEvents="none" style={styles.limeGlow} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xxl,
  },
  eyebrow: {
    ...typography.label,
    color: colors.secondary,
  },
  title: {
    ...typography.display,
    color: colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.onSurfaceVariant,
    maxWidth: 280,
    textAlign: 'center',
  },
  cyanGlow: {
    backgroundColor: 'rgba(0,238,252,0.10)',
    borderRadius: radii.pill,
    height: 320,
    position: 'absolute',
    right: -120,
    top: -40,
    transform: [{ scaleX: 1.15 }],
    width: 320,
  },
  limeGlow: {
    backgroundColor: 'rgba(243,255,202,0.08)',
    borderRadius: radii.pill,
    bottom: -120,
    height: 300,
    left: -100,
    position: 'absolute',
    width: 300,
  },
});
