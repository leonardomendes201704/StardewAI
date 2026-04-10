import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthSession } from '@/src/features/auth/auth-provider';
import { getAuthRedirectUrl } from '@/src/features/auth/deep-link';
import { reportTelemetryError, reportTelemetryEvent } from '@/src/features/observability/telemetry';
import {
  getAccountRoutes,
  type AccountType,
  readAccountTypeFromUser,
} from '@/src/features/session/account';
import {
  GhostButton,
  GlowButton,
  GlassCard,
  InputField,
  RoundIconButton,
} from '@/src/shared/components';
import { supabase } from '@/src/shared/api/supabase/client';
import { onboardingBackground } from '@/src/shared/data/prototype';
import { colors, radii, spacing, typography } from '@/src/shared/theme';

type AuthMode = 'sign-in' | 'sign-up';
type ExtendedAuthMode = AuthMode | 'recover';

export default function EmailAuthScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const router = useRouter();
  const { accountType, clearAuthCallbackError, setAccountType } = useAuthSession();
  const [mode, setMode] = useState<ExtendedAuthMode>(resolveInitialMode(params.mode));
  const [selectedAccountType, setSelectedAccountType] = useState<AccountType | null>(accountType);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (mode === 'recover') {
      await handlePasswordRecovery();
      return;
    }

    if (!selectedAccountType) {
      setErrorMessage('Escolha se esta conta entra como Bar ou Musico.');
      setFeedback(null);
      return;
    }

    if (!normalizedEmail || !normalizedPassword) {
      setErrorMessage('Preencha email e senha para continuar.');
      setFeedback(null);
      return;
    }

    setIsSubmitting(true);
    clearAuthCallbackError();
    setErrorMessage(null);
    setFeedback(null);

    try {
      await setAccountType(selectedAccountType);

      if (mode === 'sign-in') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password: normalizedPassword,
        });

        if (error) {
          throw error;
        }

        const remoteAccountType = readAccountTypeFromUser(data.user);
        const resolvedAccountType = remoteAccountType ?? selectedAccountType;

        await setAccountType(resolvedAccountType, !remoteAccountType);
        reportTelemetryEvent({
          accountId: data.user.id,
          accountType: resolvedAccountType,
          context: {
            authMode: mode,
          },
          eventName: 'auth_sign_in_succeeded',
          pathname: '/auth/email',
        });
        router.replace(getAccountRoutes(resolvedAccountType).home);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        options: {
          data: {
            account_type: selectedAccountType,
          },
          emailRedirectTo: getAuthRedirectUrl(),
        },
        password: normalizedPassword,
      });

      if (error) {
        throw error;
      }

      await setAccountType(selectedAccountType, Boolean(data.session));

      if (!data.session) {
        setFeedback(
          'Conta criada. Abra o email de confirmacao no celular com o app instalado para concluir o primeiro acesso.',
        );
        return;
      }

      reportTelemetryEvent({
        accountId: data.user?.id ?? null,
        accountType: selectedAccountType,
        context: {
          authMode: mode,
        },
        eventName: 'auth_sign_in_succeeded',
        pathname: '/auth/email',
      });
      router.replace(getAccountRoutes(selectedAccountType).home);
    } catch (error) {
      reportTelemetryError({
        context: {
          accountType: selectedAccountType,
          authMode: mode,
        },
        error,
        source: 'auth_email_submit',
      });
      setErrorMessage(
        error instanceof Error ? error.message : 'Nao foi possivel concluir a autenticacao.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePasswordRecovery() {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setErrorMessage('Informe o email da conta para recuperar o acesso.');
      setFeedback(null);
      return;
    }

    setIsSubmitting(true);
    clearAuthCallbackError();
    setErrorMessage(null);
    setFeedback(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: getAuthRedirectUrl(),
      });

      if (error) {
        throw error;
      }

      setFeedback(
        'Email enviado. Abra o link de recuperacao no mesmo aparelho com o app instalado para definir sua nova senha.',
      );
    } catch (error) {
      reportTelemetryError({
        context: {
          authMode: mode,
        },
        error,
        source: 'auth_password_recovery_request',
      });
      setErrorMessage(
        error instanceof Error ? error.message : 'Nao foi possivel enviar o email de recuperacao.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendConfirmation() {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setErrorMessage('Informe o email para reenviar a confirmacao.');
      setFeedback(null);
      return;
    }

    setIsSubmitting(true);
    clearAuthCallbackError();
    setErrorMessage(null);
    setFeedback(null);

    try {
      const { error } = await supabase.auth.resend({
        email: normalizedEmail,
        options: {
          emailRedirectTo: getAuthRedirectUrl(),
        },
        type: 'signup',
      });

      if (error) {
        throw error;
      }

      setFeedback('Novo email enviado. Abra o link no aparelho Android com o TocaAI instalado.');
    } catch (error) {
      reportTelemetryError({
        context: {
          authMode: mode,
        },
        error,
        source: 'auth_resend_confirmation',
      });
      setErrorMessage(
        error instanceof Error ? error.message : 'Nao foi possivel reenviar o email.',
      );
    } finally {
      setIsSubmitting(false);
    }
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
            <RoundIconButton icon="arrow-back" onPress={() => router.back()} />
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>
                {mode === 'sign-up'
                  ? 'Cadastro inicial'
                  : mode === 'recover'
                    ? 'Recuperacao de acesso'
                    : 'Acesso rapido'}
              </Text>
              <Text style={styles.title}>
                {mode === 'sign-up'
                  ? 'Entre para o circuito certo.'
                  : mode === 'recover'
                    ? 'Recupere seu acesso sem sair do app.'
                    : 'Seu palco ja esta esperando.'}
              </Text>
              <Text style={styles.subtitle}>
                {mode === 'recover'
                  ? 'Solicite o link por email e abra a recuperacao no mesmo aparelho com o TocaAI instalado.'
                  : 'Fluxo por email e senha sobre o shell do prototipo, com sessao local persistida.'}
              </Text>
            </View>
          </View>

          <GlassCard padding={spacing.xl} style={styles.formCard}>
            {mode === 'recover' ? (
              <GhostButton
                containerStyle={styles.recoverBackButton}
                icon="arrow-back"
                label="Voltar para entrar"
                onPress={() => {
                  clearAuthCallbackError();
                  setMode('sign-in');
                  setErrorMessage(null);
                  setFeedback(null);
                }}
              />
            ) : (
              <View style={styles.modeToggle}>
                <GhostButton
                  containerStyle={[styles.modeButton, mode === 'sign-up' && styles.modeButtonActive]}
                  icon="person-add-alt-1"
                  label="Criar conta"
                  onPress={() => {
                    clearAuthCallbackError();
                    setMode('sign-up');
                    setErrorMessage(null);
                    setFeedback(null);
                  }}
                  tone={mode === 'sign-up' ? 'primary' : 'secondary'}
                />
                <GhostButton
                  containerStyle={[styles.modeButton, mode === 'sign-in' && styles.modeButtonActive]}
                  icon="login"
                  label="Entrar"
                  onPress={() => {
                    clearAuthCallbackError();
                    setMode('sign-in');
                    setErrorMessage(null);
                    setFeedback(null);
                  }}
                  tone={mode === 'sign-in' ? 'primary' : 'secondary'}
                />
              </View>
            )}

            {mode !== 'recover' ? (
              <View style={styles.accountTypeSection}>
                <Text style={styles.sectionLabel}>Tipo de conta</Text>
                <View style={styles.accountTypeRow}>
                  <AccountTypeButton
                    accountType="bar"
                    active={selectedAccountType === 'bar'}
                    icon="storefront"
                    label="Bar"
                    onPress={() => setSelectedAccountType('bar')}
                  />
                  <AccountTypeButton
                    accountType="musician"
                    active={selectedAccountType === 'musician'}
                    icon="piano"
                    label="Musico"
                    onPress={() => setSelectedAccountType('musician')}
                  />
                </View>
              </View>
            ) : null}

            <View style={styles.fields}>
              <InputField
                autoCapitalize="none"
                autoComplete="email"
                icon="alternate-email"
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="voce@tocaai.com"
                value={email}
              />
              {mode !== 'recover' ? (
                <InputField
                  autoCapitalize="none"
                  autoComplete="password"
                  icon="lock-outline"
                  onChangeText={setPassword}
                  placeholder="Sua senha"
                  secureTextEntry
                  value={password}
                />
              ) : null}
            </View>

            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
            {feedback ? <Text style={styles.feedbackText}>{feedback}</Text> : null}

            <GlowButton
              containerStyle={[styles.submitButton, isSubmitting && styles.submitButtonBusy]}
              disabled={isSubmitting}
              icon="arrow-forward"
              label={
                isSubmitting
                  ? 'Processando'
                  : mode === 'sign-up'
                    ? 'Criar conta'
                    : mode === 'recover'
                      ? 'Enviar link de recuperacao'
                      : 'Entrar agora'
              }
              onPress={() => void handleSubmit()}
            />

            {mode !== 'recover' ? (
              <Pressable
                onPress={() =>
                  setMode((currentMode) => {
                    clearAuthCallbackError();
                    setErrorMessage(null);
                    setFeedback(null);
                    return currentMode === 'sign-up' ? 'sign-in' : 'sign-up';
                  })
                }
                style={styles.switchModeRow}>
                <Text style={styles.switchModeText}>
                  {mode === 'sign-up' ? 'Ja possui conta?' : 'Ainda nao possui conta?'}{' '}
                  <Text style={styles.switchModeLink}>
                    {mode === 'sign-up' ? 'Entrar com email' : 'Criar agora'}
                  </Text>
                </Text>
              </Pressable>
            ) : null}

            {mode === 'sign-up' ? (
              <Pressable disabled={isSubmitting} onPress={() => void handleResendConfirmation()}>
                <Text style={styles.resendText}>
                  Precisa de um novo link? <Text style={styles.resendLink}>Reenviar confirmacao</Text>
                </Text>
              </Pressable>
            ) : null}

            {mode === 'sign-in' ? (
              <Pressable
                disabled={isSubmitting}
                onPress={() => {
                  clearAuthCallbackError();
                  setMode('recover');
                  setErrorMessage(null);
                  setFeedback(null);
                }}>
                <Text style={styles.resendText}>
                  Perdeu a senha? <Text style={styles.resendLink}>Recuperar acesso</Text>
                </Text>
              </Pressable>
            ) : null}
          </GlassCard>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <View pointerEvents="none" style={styles.cyanGlow} />
      <View pointerEvents="none" style={styles.limeGlow} />
    </View>
  );
}

function AccountTypeButton({
  accountType,
  active,
  icon,
  label,
  onPress,
}: {
  accountType: AccountType;
  active: boolean;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const accent = accountType === 'bar' ? colors.secondary : colors.primary;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.accountTypeButton,
        active && styles.accountTypeButtonActive,
        pressed && styles.accountTypeButtonPressed,
      ]}>
      <MaterialIcons color={accent} name={icon} size={24} />
      <Text style={[styles.accountTypeLabel, active && styles.accountTypeLabelActive]}>{label}</Text>
    </Pressable>
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
    maxWidth: 320,
  },
  subtitle: {
    ...typography.body,
    color: colors.onSurfaceVariant,
    maxWidth: 320,
  },
  formCard: {
    gap: spacing.lg,
  },
  modeToggle: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modeButton: {
    flex: 1,
  },
  modeButtonActive: {
    backgroundColor: 'rgba(243,255,202,0.12)',
    borderColor: 'rgba(243,255,202,0.24)',
  },
  recoverBackButton: {
    alignSelf: 'flex-start',
  },
  accountTypeSection: {
    gap: spacing.sm,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.onSurfaceVariant,
  },
  accountTypeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  accountTypeButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderColor: colors.borderGhost,
    borderRadius: radii.md,
    borderWidth: 1,
    flex: 1,
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 112,
  },
  accountTypeButtonActive: {
    backgroundColor: 'rgba(37,37,49,0.82)',
    borderColor: 'rgba(243,255,202,0.18)',
  },
  accountTypeButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  accountTypeLabel: {
    ...typography.bodyBold,
    color: colors.onSurface,
    fontSize: 16,
  },
  accountTypeLabelActive: {
    color: colors.primary,
  },
  fields: {
    gap: spacing.md,
  },
  errorText: {
    ...typography.bodyMedium,
    color: '#ffb2b9',
  },
  feedbackText: {
    ...typography.bodyMedium,
    color: colors.secondary,
  },
  submitButton: {
    marginTop: spacing.xs,
  },
  submitButtonBusy: {
    opacity: 0.82,
  },
  switchModeRow: {
    alignItems: 'center',
  },
  switchModeText: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
  },
  switchModeLink: {
    color: colors.secondary,
    fontFamily: 'ManropeBold',
  },
  resendText: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  resendLink: {
    color: colors.secondary,
    fontFamily: 'ManropeBold',
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

function resolveInitialMode(mode?: string): ExtendedAuthMode {
  if (mode === 'sign-in' || mode === 'recover') {
    return mode;
  }

  return 'sign-up';
}
