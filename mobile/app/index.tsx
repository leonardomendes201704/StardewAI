import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthSession } from '@/src/features/auth/auth-provider';
import { type AccountType } from '@/src/features/session/account';
import { GlassCard } from '@/src/shared/components';
import { onboardingBackground } from '@/src/shared/data/prototype';
import { colors, radii, spacing, typography } from '@/src/shared/theme';

export default function OnboardingScreen() {
  const router = useRouter();
  const { setAccountType } = useAuthSession();

  function handleStart(accountType: AccountType) {
    void setAccountType(accountType);
    router.push('/auth/email?mode=sign-up');
  }

  return (
    <View style={styles.container}>
      <ImageBackground source={{ uri: onboardingBackground }} style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['rgba(13,13,22,0.96)', 'rgba(13,13,22,0.48)', 'rgba(13,13,22,0.92)']}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />
      </ImageBackground>

      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Marketplace musical</Text>
          <Text style={styles.title}>Escolha como voce entra no app</Text>
          <Text style={styles.subtitle}>Bar ou Musico, cada jornada abre um painel proprio.</Text>
        </View>

        <View style={styles.stack}>
          <OptionCard
            cta="COMEcar AGORA"
            icon="storefront"
            onPress={() => handleStart('bar')}
            subtitle="Pubs, bares e casas de show buscando a atracao perfeita para sua noite."
            title="Sou um Estabelecimento"
            tone="secondary"
          />

          <OptionCard
            cta="CRIAR MEU PORTFOLIO"
            icon="piano"
            onPress={() => handleStart('musician')}
            subtitle="Artistas e bandas prontos para dominar os melhores palcos da cidade."
            title="Sou um Musico"
            tone="primary"
          />
        </View>

        <Pressable onPress={() => router.push('/auth/email?mode=sign-in')} style={styles.loginRow}>
          <Text style={styles.loginText}>
            Ja possui uma conta? <Text style={styles.loginLink}>Entrar agora</Text>
          </Text>
        </Pressable>
      </SafeAreaView>

      <View pointerEvents="none" style={styles.cyanGlow} />
      <View pointerEvents="none" style={styles.limeGlow} />
    </View>
  );
}

type OptionCardProps = {
  cta: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
  subtitle: string;
  title: string;
  tone: 'primary' | 'secondary';
};

function OptionCard({ cta, icon, onPress, subtitle, title, tone }: OptionCardProps) {
  const accent = tone === 'primary' ? colors.primary : colors.secondary;
  const accentSurface = tone === 'primary' ? 'rgba(243,255,202,0.10)' : 'rgba(0,238,252,0.10)';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      <GlassCard padding={spacing.xl} style={styles.optionCard}>
        <View style={[styles.optionIcon, { backgroundColor: accentSurface }]}>
          <MaterialIcons color={accent} name={icon} size={34} />
        </View>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionCopy}>{subtitle}</Text>
        <View style={styles.ctaRow}>
          <Text style={[styles.optionCta, { color: accent }]}>{cta}</Text>
          <MaterialIcons color={accent} name="arrow-forward" size={18} />
        </View>
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
    gap: spacing.sm,
  },
  eyebrow: {
    ...typography.label,
    color: colors.secondary,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    ...typography.screenTitle,
    color: colors.onSurface,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 260,
  },
  stack: {
    gap: spacing.lg,
  },
  optionCard: {
    minHeight: 224,
  },
  optionIcon: {
    width: 80,
    height: 80,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  optionTitle: {
    ...typography.sectionTitle,
    color: colors.onSurface,
    textAlign: 'center',
  },
  optionCopy: {
    ...typography.body,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  ctaRow: {
    marginTop: 'auto',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  optionCta: {
    ...typography.label,
  },
  loginRow: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  loginText: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
  },
  loginLink: {
    color: colors.secondary,
    fontFamily: 'ManropeBold',
  },
  cyanGlow: {
    position: 'absolute',
    top: -40,
    right: -120,
    width: 320,
    height: 320,
    backgroundColor: 'rgba(0,238,252,0.10)',
    borderRadius: radii.pill,
    transform: [{ scaleX: 1.15 }],
  },
  limeGlow: {
    position: 'absolute',
    bottom: -120,
    left: -100,
    width: 300,
    height: 300,
    backgroundColor: 'rgba(243,255,202,0.08)',
    borderRadius: radii.pill,
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.985 }],
  },
});
