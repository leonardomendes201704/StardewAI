import { usePathname, useRouter } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';

import { useAuthSession } from '@/src/features/auth/auth-provider';
import { getAccountRoutes } from '@/src/features/session/account';
import { useSessionStore } from '@/src/features/session/session-store';
import { StartupSplashScreen } from '@/src/shared/components/startup-splash-screen';

export function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { accountType, isPasswordRecoveryPending, isReady, session } = useAuthSession();
  const isHydrated = useSessionStore((state) => state.isHydrated);
  const [minimumSplashElapsed, setMinimumSplashElapsed] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setMinimumSplashElapsed(true);
    }, 2000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (!isReady || !isHydrated) {
      return;
    }

    const isAuthRoute = pathname.startsWith('/auth');
    const isPasswordRecoveryRoute = pathname === '/auth/recovery';
    const isRootRoute = pathname === '/';
    const isPublicRoute = isRootRoute || isAuthRoute;

    if (!session) {
      if (isPasswordRecoveryRoute) {
        router.replace('/auth/email?mode=sign-in');
        return;
      }

      if (!isPublicRoute) {
        router.replace('/');
      }
      return;
    }

    if (isPasswordRecoveryPending) {
      if (!isAuthRoute) {
        router.replace('/auth/recovery');
      }
      return;
    }

    if (!accountType) {
      if (!isAuthRoute) {
        router.replace('/auth/email');
      }
      return;
    }

    const routes = getAccountRoutes(accountType);

    if (accountType === 'bar' && pathname.startsWith('/musician')) {
      router.replace(routes.home);
      return;
    }

    if (accountType === 'musician' && pathname.startsWith('/bar')) {
      router.replace(routes.home);
      return;
    }

    if (isPublicRoute && pathname !== routes.home) {
      router.replace(routes.home);
    }
  }, [accountType, isHydrated, isPasswordRecoveryPending, isReady, pathname, router, session]);

  if (!minimumSplashElapsed || !isReady || !isHydrated) {
    return <StartupSplashScreen />;
  }

  return <>{children}</>;
}
