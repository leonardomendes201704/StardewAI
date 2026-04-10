import { useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';

import { reportTelemetryError } from '@/src/features/observability/telemetry';
import { GlassCard, GlowButton } from '@/src/shared/components';
import { colors, spacing, typography } from '@/src/shared/theme';

type RouteErrorBoundaryProps = {
  error: Error;
  retry: () => void;
};

export function ObservabilityRouteErrorBoundary({
  error,
  retry,
}: RouteErrorBoundaryProps) {
  useEffect(() => {
    reportTelemetryError({
      error,
      severity: 'fatal',
      source: 'route_boundary',
    });
  }, [error]);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        <GlassCard padding={spacing.xl} style={styles.card} surface="panel">
          <Text style={styles.eyebrow}>Falha critica</Text>
          <Text style={styles.title}>Algo saiu do trilho nesta tela.</Text>
          <Text style={styles.description}>
            O erro foi registrado para observabilidade do MVP. Tente carregar novamente.
          </Text>
          <GlowButton icon="refresh" label="Tentar novamente" onPress={retry} />
        </GlassCard>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  card: {
    gap: spacing.md,
  },
  eyebrow: {
    ...typography.label,
    color: colors.secondary,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.onSurface,
  },
  description: {
    ...typography.body,
    color: colors.onSurfaceVariant,
  },
});
