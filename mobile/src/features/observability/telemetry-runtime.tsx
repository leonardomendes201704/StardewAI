import { usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { useAuthSession } from '@/src/features/auth/auth-provider';
import {
  getTelemetryPathname,
  installGlobalTelemetryErrorHandler,
  reportTelemetryEvent,
  setTelemetryPathname,
} from '@/src/features/observability/telemetry';

export function ObservabilityRuntime() {
  const pathname = usePathname();
  const { accountType, isReady, user } = useAuthSession();
  const lastTrackedPathname = useRef<string | null>(null);
  const lastStartedSessionForUser = useRef<string | null>(null);

  useEffect(() => {
    installGlobalTelemetryErrorHandler();
  }, []);

  useEffect(() => {
    setTelemetryPathname(pathname ?? null);
  }, [pathname]);

  useEffect(() => {
    if (!isReady || !user?.id) {
      return;
    }

    if (lastStartedSessionForUser.current !== user.id) {
      lastStartedSessionForUser.current = user.id;
      reportTelemetryEvent({
        accountType,
        context: {
          trigger: 'auth_ready',
        },
        eventName: 'app_session_started',
        pathname,
      });
    }
  }, [accountType, isReady, pathname, user?.id]);

  useEffect(() => {
    if (!isReady || !user?.id || !pathname) {
      return;
    }

    if (lastTrackedPathname.current === pathname) {
      return;
    }

    lastTrackedPathname.current = pathname;
    reportTelemetryEvent({
      accountType,
      eventName: 'screen_view',
      pathname,
    });
  }, [accountType, isReady, pathname, user?.id]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) => {
      if (status !== 'active' || !user?.id) {
        return;
      }

      reportTelemetryEvent({
        accountType,
        context: {
          trigger: 'app_state_active',
        },
        eventName: 'app_foregrounded',
        pathname: getTelemetryPathname(),
      });
    });

    return () => {
      subscription.remove();
    };
  }, [accountType, user?.id]);

  return null;
}
