import type { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import * as Linking from 'expo-linking';

import { parseAuthCallbackUrl } from '@/src/features/auth/deep-link';
import { reportTelemetryError, reportTelemetryEvent } from '@/src/features/observability/telemetry';
import { readAccountTypeFromUser, type AccountType } from '@/src/features/session/account';
import { useSessionStore } from '@/src/features/session/session-store';
import { supabase } from '@/src/shared/api/supabase/client';

type AuthContextValue = {
  accountType: AccountType | null;
  authCallbackError: string | null;
  clearAuthCallbackError: () => void;
  clearPasswordRecovery: () => void;
  isPasswordRecoveryPending: boolean;
  isReady: boolean;
  session: Session | null;
  setAccountType: (accountType: AccountType | null, persistRemote?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  user: User | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const storedAccountType = useSessionStore((state) => state.accountType);
  const pendingAuthFlow = useSessionStore((state) => state.pendingAuthFlow);
  const setStoredAccountType = useSessionStore((state) => state.setAccountType);
  const setPendingAuthFlow = useSessionStore((state) => state.setPendingAuthFlow);
  const [authCallbackError, setAuthCallbackError] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    function syncAccountType(nextSession: Session | null) {
      const nextAccountType = readAccountTypeFromUser(nextSession?.user);

      if (nextAccountType) {
        useSessionStore.getState().setAccountType(nextAccountType);
      }
    }

    async function consumeAuthCallback(url: string) {
      const authCallback = parseAuthCallbackUrl(url);

      if (!authCallback) {
        return false;
      }

      if (authCallback.errorCode || authCallback.errorDescription) {
        reportTelemetryError({
          context: {
            authCallbackType: authCallback.type,
            errorCode: authCallback.errorCode,
          },
          error: authCallback.errorDescription ?? 'Erro retornado no callback de autenticacao.',
          source: 'auth_callback',
        });
        setAuthCallbackError(
          authCallback.errorDescription ?? 'Nao foi possivel validar o link recebido.',
        );
        setPendingAuthFlow(null);
        return true;
      }

      if (!authCallback.accessToken || !authCallback.refreshToken) {
        reportTelemetryError({
          context: {
            authCallbackType: authCallback.type,
          },
          error: 'O callback de autenticacao nao retornou tokens suficientes para o app.',
          source: 'auth_callback',
        });
        setAuthCallbackError('O link nao retornou uma sessao valida para o app.');
        setPendingAuthFlow(null);
        return true;
      }

      const { data, error } = await supabase.auth.setSession({
        access_token: authCallback.accessToken,
        refresh_token: authCallback.refreshToken,
      });

      if (error) {
        reportTelemetryError({
          context: {
            authCallbackType: authCallback.type,
          },
          error,
          source: 'auth_callback',
        });
        setAuthCallbackError(error.message);
        return true;
      }

      setAuthCallbackError(null);
      setSession(data.session);
      syncAccountType(data.session);
      setPendingAuthFlow(authCallback.type === 'recovery' ? 'password-recovery' : null);
      if (authCallback.type !== 'recovery') {
        reportTelemetryEvent({
          accountId: data.session?.user.id ?? null,
          accountType: readAccountTypeFromUser(data.session?.user),
          context: {
            authCallbackType: authCallback.type,
          },
          eventName: 'auth_email_confirmation_completed',
        });
      }
      return true;
    }

    async function syncInitialSession() {
      const initialUrl = await Linking.getInitialURL();

      if (initialUrl) {
        await consumeAuthCallback(initialUrl);
      }

      const { data, error } = await supabase.auth.getSession();

      if (error) {
        reportTelemetryError({
          error,
          source: 'auth_session_bootstrap',
        });
        setSession(null);
        setIsReady(true);
        return;
      }

      setSession(data.session);
      syncAccountType(data.session);
      if (data.session?.user) {
        reportTelemetryEvent({
          accountId: data.session.user.id,
          accountType: readAccountTypeFromUser(data.session.user),
          eventName: 'session_restored',
        });
      }
      setIsReady(true);
    }

    void syncInitialSession();

    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      void consumeAuthCallback(url);
    });

    const authListener = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      syncAccountType(nextSession);

      if (nextSession) {
        setAuthCallbackError(null);
      }

      if (event === 'PASSWORD_RECOVERY') {
        setPendingAuthFlow('password-recovery');
      }

      if (event === 'SIGNED_OUT') {
        setPendingAuthFlow(null);
      }

      setIsReady(true);
    });

    return () => {
      linkingSubscription.remove();
      authListener.data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const appStateSubscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') {
        void supabase.auth.startAutoRefresh();
        return;
      }

      void supabase.auth.stopAutoRefresh();
    });

    return () => {
      appStateSubscription.remove();
    };
  }, []);

  async function setAccountType(accountType: AccountType | null, persistRemote = false) {
    setStoredAccountType(accountType);

    if (!persistRemote || !accountType || !session?.user) {
      return;
    }

    const { data, error } = await supabase.auth.updateUser({
      data: {
        account_type: accountType,
      },
    });

    if (error) {
      throw error;
    }

    if (data.user) {
      setSession((currentSession) => {
        if (!currentSession) {
          return currentSession;
        }

        return {
          ...currentSession,
          user: data.user,
        };
      });
    }
  }

  async function signOut() {
    if (session?.user) {
      reportTelemetryEvent({
        accountId: session.user.id,
        accountType: readAccountTypeFromUser(session.user) ?? storedAccountType,
        eventName: 'auth_sign_out_requested',
      });
    }

    const { error } = await supabase.auth.signOut();

    if (error) {
      reportTelemetryError({
        error,
        source: 'auth_sign_out',
      });
      throw error;
    }
  }

  async function updatePassword(password: string) {
    const { data, error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      reportTelemetryError({
        error,
        source: 'auth_password_update',
      });
      throw error;
    }

    if (data.user) {
      reportTelemetryEvent({
        accountId: data.user.id,
        accountType: readAccountTypeFromUser(data.user) ?? storedAccountType,
        eventName: 'auth_password_updated',
      });
      setSession((currentSession) => {
        if (!currentSession) {
          return currentSession;
        }

        return {
          ...currentSession,
          user: data.user,
        };
      });
    }
  }

  const accountType = readAccountTypeFromUser(session?.user) ?? storedAccountType;
  const isPasswordRecoveryPending = pendingAuthFlow === 'password-recovery';

  return (
    <AuthContext.Provider
      value={{
        accountType,
        authCallbackError,
        clearAuthCallbackError: () => setAuthCallbackError(null),
        clearPasswordRecovery: () => setPendingAuthFlow(null),
        isPasswordRecoveryPending,
        isReady,
        session,
        setAccountType,
        signOut,
        updatePassword,
        user: session?.user ?? null,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthSession() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuthSession must be used within AuthProvider.');
  }

  return context;
}
