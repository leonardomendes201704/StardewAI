import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthSession } from '@/src/features/auth/auth-provider';
import { BarArtistSearchScreen } from '@/src/features/search/bar-artist-search-screen';
import { BottomNav, Chip, EmptyState, InputField, TopBar } from '@/src/shared/components';
import { colors, spacing, typography } from '@/src/shared/theme';

export default function SearchScreen() {
  const { accountType } = useAuthSession();

  if (accountType === 'bar') {
    return <BarArtistSearchScreen />;
  }

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.screen}>
      <TopBar centeredBrand location="Busca Curada" title="TocaAI" />

      <View style={styles.body}>
        <View style={styles.content}>
          <Text style={styles.title}>Explore sons, casas e formatos</Text>
          <InputField placeholder="Buscar vagas, estilos ou regioes..." />
          <View style={styles.filters}>
            <Chip active label="Todos" tone="primary" />
            <Chip label="Bandas" tone="neutral" />
            <Chip label="DJs" tone="neutral" />
            <Chip label="Acustico" tone="neutral" />
          </View>
          <EmptyState
            description="A busca dedicada do Musico ainda entra em uma trilha propria. O foco desta sprint foi a descoberta ativa de artistas pelo Bar."
            eyebrow="Em construcao"
            title="Busca do Musico entra na proxima camada"
          />
        </View>

        <BottomNav accountType={accountType ?? 'musician'} active="search" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
    position: 'relative',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: 132,
    gap: spacing.lg,
  },
  title: {
    ...typography.screenTitle,
    color: colors.onSurface,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
