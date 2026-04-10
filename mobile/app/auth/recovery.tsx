import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthSession } from '@/src/features/auth/auth-provider';
import { reportTelemetryError } from '@/src/features/observability/telemetry';
import { getAccountRoutes } from '@/src/features/session/account';
import {
  GhostButton,
  GlassCard,
  GlowButton,
  InputField,
  RoundIconButton,
} from '@/src/shared/components';
import { onboardingBackground } from '@/src/shared/data/prototype';
import { colors, radii, spacing, typography } from '@/src/shared/theme';

export default function PasswordRecoveryScreen() {
  const router = useRouter();
  const { accountType, clearPasswordRecovery, isPasswordRecoveryPending, session, updatePassword } =
    useAuthSession();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [didSucceed, setDidSucceed] = useState(false);

  const homeRoute = accountType ? getAccountRoutes(accountType).home : '/auth/email?mode=sign-in';

  async function handleSubmit() {
    const normalizedPassword = password.trim();
    const normalizedConfirmation = confirmPassword.trim();

    if (normalizedPassword.length < 6) {
      setErrorMessage('Use uma nova senha com pelo menos 6 caracteres.');
      return;
    }

    if (normalizedPassword !== normalizedConfirmation) {
      setErrorMessage('As duas senhas precisam ser iguais.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await updatePassword(normalizedPassword);
      setDidSucceed(true);
    } catch (error) {
      reportTelemetryError({
        error,
        source: 'auth_password_recovery_submit',
      });
      setErrorMessage(
        error instanceof Error ? error.message : 'Nao foi possivel redefinir sua senha.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function finishRecovery() {
    clearPasswordRecovery();
    router.replace(homeRoute);
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardWrap}>
          <View style={styles.header}>
            <RoundIconButton
              icon="arrow-back"
              onPress={() => {
                clearPasswordRecovery();
                router.replace('/auth/email?mode=sign-in');
              }}
            />
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>Nova senha</Text>
              <Text style={styles.title}>Defina um novo acesso para sua conta.</Text>
              <Text style={styles.subtitle}>
                O link de recuperacao precisa ser aberto no mesmo aparelho com o app instalado.
              </Text>
            </View>
          </View>

          <GlassCard padding={spacing.xl} style={styles.formCard}>
            {!isPasswordRecoveryPending || !session ? (
              <>
                <Text style={styles.sectionLabel}>Link indisponivel</Text>
                <Text style={styles.helperText}>
                  O app nao encontrou uma sessao valida de recuperacao. Solicite um novo email e
                  abra o link no mesmo aparelho.
                </Text>
                <GlowButton
                  icon="login"
                  label="Voltar ao login"
                  onPress={() => {
                    clearPasswordRecovery();
                    router.replace('/auth/email?mode=sign-in');
                  }}
                />
              </>
            ) : didSucceed ? (
              <>
                <Text style={styles.sectionLabel}>Senha atualizada</Text>
                <Text style={styles.successTitle}>Recuperacao concluida com sucesso.</Text>
                <Text style={styles.helperText}>
                  Sua nova senha ja esta ativa. Voce pode seguir direto para o app com a sessao
                  atual.
                </Text>
                <GlowButton icon="arrow-forward" label="Abrir meu painel" onPress={finishRecovery} />
              </>
            ) : (
              <>
                <Text style={styles.sectionLabel}>Redefinir senha</Text>
                <Text style={styles.helperText}>
                  Escolha uma nova senha para substituir o acesso anterior.
                </Text>
                <View style={styles.fields}>
                  <InputField
                    autoCapitalize="none"
                    autoComplete="password-new"
                    icon="lock-outline"
                    onChangeText={setPassword}
                    placeholder="Nova senha"
                    secureTextEntry
                    value={password}
                  />
                  <InputField
                    autoCapitalize="none"
                    autoComplete="password-new"
                    icon="verified-user"
                    onChangeText={setConfirmPassword}
                    placeholder="Confirmar nova senha"
                    secureTextEntry
                    value={confirmPassword}
                  />
                </View>
                {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
                <GlowButton
                  containerStyle={[styles.submitButton, isSubmitting && styles.submitButtonBusy]}
                  disabled={isSubmitting}
                  icon="save"
                  label={isSubmitting ? 'Salvando' : 'Salvar nova senha'}
                  onPress={() => void handleSubmit()}
                />
                <GhostButton
                  icon="login"
                  label="Cancelar e voltar ao login"
                  onPress={() => {
                    clearPasswordRecovery();
                    router.replace('/auth/email?mode=sign-in');
                  }}
                />
              </>
            )}
          </GlassCard>
        </KeyboardAvoidingView>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  keyboardWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  headerCopy: {
    gap: spacing.sm,
  },
  eyebrow: {
    ...typography.label,
    color: colors.secondary,
  },
  title: {
    ...typography.screenTitle,
    color: colors.primary,
    maxWidth: 340,
  },
  subtitle: {
    ...typography.body,
    color: colors.onSurfaceVariant,
    maxWidth: 340,
  },
  formCard: {
    gap: spacing.lg,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.secondary,
  },
  successTitle: {
    ...typography.sectionTitle,
    color: colors.primary,
  },
  helperText: {
    ...typography.body,
    color: colors.onSurfaceVariant,
  },
  fields: {
    gap: spacing.md,
  },
  errorText: {
    ...typography.bodyMedium,
    color: '#ffb2b9',
  },
  submitButton: {
    marginTop: spacing.xs,
  },
  submitButtonBusy: {
    opacity: 0.82,
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
