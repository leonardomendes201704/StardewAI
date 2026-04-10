import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthSession } from '@/src/features/auth/auth-provider';
import { GlassCard, GlowButton, LoadingScreen } from '@/src/shared/components';
import { onboardingBackground } from '@/src/shared/data/prototype';
import { colors, radii, spacing, typography } from '@/src/shared/theme';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const { authCallbackError, clearAuthCallbackError, isPasswordRecoveryPending, session } =
    useAuthSession();

  useEffect(() => {
    if (isPasswordRecoveryPending && session) {
      router.replace('/auth/recovery');
    }
  }, [isPasswordRecoveryPending, router, session]);

  if (!authCallbackError) {
    return (
      <LoadingScreen
        eyebrow={isPasswordRecoveryPending ? 'Recuperacao em andamento' : 'Confirmacao em andamento'}
        subtitle={
          isPasswordRecoveryPending
            ? 'Recebemos o link do email. Abrindo a tela para definir sua nova senha.'
            : session
              ? 'Sessao recebida. Abrindo seu painel agora.'
              : 'Recebemos o link do email. Validando seu acesso no app.'
        }
        title={isPasswordRecoveryPending ? 'Preparando redefinicao' : 'Confirmando acesso'}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ImageBackground source={{ uri: onboardingBackground }} style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['rgba(13,13,22,0.98)', 'rgba(13,13,22,0.76)', 'rgba(13,13,22,0.98)']}
          locations={[0, 0.4, 1]}
          style={StyleSheet.absoluteFill}
        />
      </ImageBackground>

      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <GlassCard padding={spacing.xl} style={styles.card}>
          <Text style={styles.eyebrow}>Link invalido</Text>
          <Text style={styles.title}>Nao foi possivel concluir a confirmacao.</Text>
          <Text style={styles.subtitle}>
            {authCallbackError} Abra um novo email de confirmacao no aparelho com o app instalado,
            ou volte ao login para entrar manualmente depois que o email estiver confirmado.
          </Text>
          <GlowButton
            label="Voltar ao login"
            onPress={() => {
              clearAuthCallbackError();
              router.replace('/auth/email?mode=sign-in');
            }}
          />
        </GlassCard>
      </SafeAreaView>

      <View pointerEvents="none" style={styles.cyanGlow} />
      <View pointerEvents="none" style={styles.limeGlow} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  card: {
    gap: spacing.lg,
  },
  eyebrow: {
    ...typography.label,
    color: colors.secondary,
  },
  title: {
    ...typography.screenTitle,
    color: colors.primary,
  },
  subtitle: {
    ...typography.body,
    color: colors.onSurfaceVariant,
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
