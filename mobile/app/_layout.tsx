import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Manrope_400Regular, Manrope_500Medium, Manrope_700Bold } from '@expo-google-fonts/manrope';
import { SplineSans_500Medium, SplineSans_700Bold } from '@expo-google-fonts/spline-sans';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AuthGate } from '@/src/features/auth/auth-gate';
import { PushNotificationsProvider } from '@/src/features/notifications/notifications-provider';
import { ObservabilityRouteErrorBoundary } from '@/src/features/observability/route-error-boundary';
import { ObservabilityRuntime } from '@/src/features/observability/telemetry-runtime';
import { AppProviders } from '@/src/shared/providers/AppProviders';
import { colors } from '@/src/shared/theme';

export const ErrorBoundary = ObservabilityRouteErrorBoundary;

export const unstable_settings = {
  initialRouteName: 'index',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ManropeRegular: Manrope_400Regular,
    ManropeMedium: Manrope_500Medium,
    ManropeBold: Manrope_700Bold,
    SplineSansMedium: SplineSans_500Medium,
    SplineSansBold: SplineSans_700Bold,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (!loaded) {
      return;
    }

    void SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const navigationTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surfaceContainerLowest,
      text: colors.onSurface,
      border: colors.borderGhost,
      notification: colors.secondary,
    },
  };

  return (
    <AppProviders>
      <AuthGate>
        <ThemeProvider value={navigationTheme ?? DefaultTheme}>
          <PushNotificationsProvider>
            <ObservabilityRuntime />
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
                animation: 'fade',
              }}
            />
          </PushNotificationsProvider>
        </ThemeProvider>
      </AuthGate>
    </AppProviders>
  );
}
