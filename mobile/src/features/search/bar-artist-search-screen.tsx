import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  type BarArtistSearchRecord,
  useBarArtistSearch,
} from '@/src/features/search/bar-artist-search';
import {
  BottomNav,
  EmptyState,
  GlassCard,
  ImageUri,
  InputField,
  TopBar,
} from '@/src/shared/components';
import { formatDistanceKm } from '@/src/shared/lib/geolocation';
import { colors, radii, spacing, typography } from '@/src/shared/theme';

const budgetRanges = [
  { key: 'all', label: 'Todos' },
  { key: 'up_to_300', label: 'Ate R$ 300' },
  { key: 'between_300_600', label: 'R$ 300-600' },
  { key: 'above_600', label: 'R$ 600+' },
] as const;

type BudgetRangeKey = (typeof budgetRanges)[number]['key'];
type DistanceScope = 'all' | 'up_to_25' | 'up_to_50' | 'within_artist_radius';
type RegionScope = 'all' | 'city' | 'state';

const defaultArtistImage =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCrt1x9MZ1YV-DOzUUTG9KuJgd7GOkSWSdo8aLxGeNdkKKBVX9agul9JOWv2lyEEBHZR_iqysSY0CCS4acK0sg1yRpUYrcZYrBbhAcbTY63lGvuzyG6oiYZf503WKqF4fVAIAaHXjR1zxps2keXJcWzAs3ZI7avUQOkhELUjUd29OPwFNObgoj4pMTMMVzR4J6eRH2Jxt3bd8CHLmiLsArY8rCjVX6rG_jCvdOwv6S42wNB0bv1FhPvEuAfVCVefpuxPDBodSKxpRxG';

export function BarArtistSearchScreen() {
  const router = useRouter();
  const searchQuery = useBarArtistSearch();
  const [searchText, setSearchText] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('Todos');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [selectedBudgetRange, setSelectedBudgetRange] = useState<BudgetRangeKey>('all');
  const [selectedDistanceScope, setSelectedDistanceScope] = useState<DistanceScope>('all');
  const [selectedRegion, setSelectedRegion] = useState<RegionScope>('all');

  const venueCity = searchQuery.data?.venueCity ?? null;
  const venueState = searchQuery.data?.venueState ?? null;
  const regionOptions: Array<{ key: RegionScope; label: string }> = [
    ...(venueCity && venueState ? [{ key: 'city' as const, label: 'Minha cidade' }] : []),
    ...(venueState ? [{ key: 'state' as const, label: 'Meu estado' }] : []),
    { key: 'all' as const, label: 'Todos' },
  ];
  const genreOptions = ['Todos', ...(searchQuery.data?.genres ?? [])];
  const categoryOptions = ['Todos', ...(searchQuery.data?.categories ?? [])];
  const artists = filterArtists(searchQuery.data?.artists ?? [], {
    budgetRange: selectedBudgetRange,
    category: selectedCategory,
    genre: selectedGenre,
    distanceScope: selectedDistanceScope,
    region: selectedRegion,
    searchText,
    venueCity,
    venueState,
  });
  const distanceOptions = [
    { key: 'all' as const, label: 'Todas' },
    { key: 'within_artist_radius' as const, label: 'No raio do artista' },
    { key: 'up_to_25' as const, label: 'Ate 25 km' },
    { key: 'up_to_50' as const, label: 'Ate 50 km' },
  ];

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.screen}>
      <TopBar centeredBrand location="Busca de artistas" title="TocaAI" />

      <View style={styles.body}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <GlassCard padding={spacing.xl} surface="panel">
            <Text style={styles.sectionEyebrow}>Busca ativa do Bar</Text>
            <Text style={styles.sectionTitle}>Descubra artistas por perfil, faixa de cache e regiao.</Text>
            <Text style={styles.sectionCopy}>
              Filtre por estilo, categoria, faixa de cache e proximidade para abrir o perfil completo do musico.
            </Text>
            <InputField
              icon="search"
              onChangeText={setSearchText}
              placeholder="Buscar por nome, genero, cidade ou UF..."
              value={searchText}
            />
          </GlassCard>

          <FilterBlock
            activeKey={selectedRegion}
            eyebrow="Regiao"
            onChange={(value) => setSelectedRegion(value as RegionScope)}
            options={regionOptions}
            title="Escopo geografico"
          />

          <FilterBlock
            activeKey={selectedGenre}
            eyebrow="Genero"
            onChange={setSelectedGenre}
            options={genreOptions.map((label) => ({ key: label, label }))}
            title="Estilo musical"
          />

          <FilterBlock
            activeKey={selectedCategory}
            eyebrow="Categoria"
            onChange={setSelectedCategory}
            options={categoryOptions.map((label) => ({ key: label, label }))}
            title="Formato artistico"
          />

          <FilterBlock
            activeKey={selectedBudgetRange}
            eyebrow="Cache"
            onChange={(value) => setSelectedBudgetRange(value as BudgetRangeKey)}
            options={budgetRanges.map((item) => ({ key: item.key, label: item.label }))}
            title="Faixa de cache"
          />

          <FilterBlock
            activeKey={selectedDistanceScope}
            eyebrow="Distancia"
            onChange={(value) => setSelectedDistanceScope(value as DistanceScope)}
            options={distanceOptions}
            title="Deslocamento e raio"
          />

          <View style={styles.resultHeader}>
            <Text style={styles.sectionTitle}>Artistas encontrados</Text>
            <Text style={styles.resultMeta}>{`${artists.length} perfil(is)`}</Text>
          </View>

          {searchQuery.isLoading && !searchQuery.data ? (
            <>
              <ArtistLoadingCard />
              <ArtistLoadingCard />
            </>
          ) : searchQuery.isError ? (
            <EmptyState
              description={
                searchQuery.error instanceof Error
                  ? searchQuery.error.message
                  : 'Nao foi possivel carregar os artistas agora.'
              }
              eyebrow="Busca"
              title="Falha ao buscar artistas"
            />
          ) : artists.length > 0 ? (
            artists.map((artist) => (
              <Pressable
                key={artist.artistId}
                onPress={() => router.push(`/bar/artists/${artist.artistId}`)}
                style={({ pressed }) => [styles.cardPressable, pressed && styles.cardPressed]}>
                <GlassCard padding={spacing.lg} style={styles.artistCard} surface="panel">
                  <View style={styles.artistTop}>
                    <ImageUri source={artist.coverImageUrl ?? defaultArtistImage} style={styles.artistImage} />
                    <View style={styles.artistCopy}>
                      <View style={styles.artistTitleRow}>
                        <Text style={styles.artistTitle}>{artist.stageName}</Text>
                        <View style={styles.ratingPill}>
                          <MaterialIcons color={colors.primary} name="star" size={14} />
                          <Text style={styles.ratingText}>
                            {artist.ratingAverage !== null ? artist.ratingAverage.toFixed(1) : 'Novo'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.artistMeta}>
                        {[artist.artistCategory, artist.city, artist.state].filter(Boolean).join(' - ')}
                      </Text>
                      <Text style={styles.artistBio} numberOfLines={2}>
                        {artist.bio || 'Perfil publico pronto para avaliacao do Bar.'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.chipsRow}>
                    {artist.genres.slice(0, 4).map((genre) => (
                      <View key={`${artist.artistId}-${genre}`} style={styles.metaChip}>
                        <Text style={styles.metaChipText}>{genre}</Text>
                      </View>
                    ))}
                    {artist.performanceRadiusKm !== null ? (
                      <View style={[styles.metaChip, styles.metaChipSecondary]}>
                        <Text style={styles.metaChipSecondaryText}>{`Raio ${artist.performanceRadiusKm} km`}</Text>
                      </View>
                    ) : null}
                    {artist.distanceKm !== null ? (
                      <View style={[styles.metaChip, styles.metaChipSecondary]}>
                        <Text style={styles.metaChipSecondaryText}>
                          {formatDistanceKm(artist.distanceKm)}
                        </Text>
                      </View>
                    ) : null}
                    {artist.isWithinTravelRadius === true ? (
                      <View style={[styles.metaChip, styles.metaChipPrimary]}>
                        <Text style={styles.metaChipPrimaryText}>Alcanca sua casa</Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.artistBottom}>
                    <Text style={styles.priceLabel}>{formatCacheLabel(artist.baseCacheCents)}</Text>
                    <Text style={styles.detailLink}>Abrir perfil completo</Text>
                  </View>
                </GlassCard>
              </Pressable>
            ))
          ) : (
            <EmptyState
              description="Ajuste os filtros ou limpe a busca para ampliar a lista de artistas."
              eyebrow="Busca"
              title="Nenhum artista encontrado"
            />
          )}
        </ScrollView>

        <BottomNav accountType="bar" active="search" />
      </View>
    </SafeAreaView>
  );
}

function FilterBlock({
  activeKey,
  eyebrow,
  onChange,
  options,
  title,
}: {
  activeKey: string;
  eyebrow: string;
  onChange: (value: string) => void;
  options: Array<{ key: string; label: string }>;
  title: string;
}) {
  return (
    <GlassCard padding={spacing.lg} surface="panel">
      <Text style={styles.filterEyebrow}>{eyebrow}</Text>
      <Text style={styles.filterTitle}>{title}</Text>
      <View style={styles.filterWrap}>
        {options.map((option) => (
          <FilterPill
            active={option.key === activeKey}
            key={option.key}
            label={option.label}
            onPress={() => onChange(option.key)}
          />
        ))}
      </View>
    </GlassCard>
  );
}

function FilterPill({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.filterPill,
        active && styles.filterPillActive,
        pressed && styles.cardPressed,
      ]}>
      <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>{label}</Text>
    </Pressable>
  );
}

function ArtistLoadingCard() {
  return (
    <GlassCard padding={spacing.lg} style={styles.artistCard} surface="panel">
      <View style={styles.loadingRow}>
        <View style={styles.loadingImage} />
        <View style={styles.loadingCopy}>
          <View style={styles.loadingBlock} />
          <View style={[styles.loadingBlock, styles.loadingMedium]} />
          <View style={[styles.loadingBlock, styles.loadingWide]} />
        </View>
      </View>
      <View style={[styles.loadingBlock, styles.loadingWide]} />
      <View style={[styles.loadingBlock, styles.loadingAction]} />
    </GlassCard>
  );
}

function filterArtists(
  artists: BarArtistSearchRecord[],
  {
    budgetRange,
    category,
    distanceScope,
    genre,
    region,
    searchText,
    venueCity,
    venueState,
  }: {
    budgetRange: BudgetRangeKey;
    category: string;
    distanceScope: DistanceScope;
    genre: string;
    region: RegionScope;
    searchText: string;
    venueCity: string | null;
    venueState: string | null;
  },
) {
  const normalizedSearch = searchText.trim().toLowerCase();

  return artists.filter((artist) => {
    if (genre !== 'Todos' && !artist.genres.includes(genre)) {
      return false;
    }

    if (category !== 'Todos' && artist.artistCategory !== category) {
      return false;
    }

    if (region === 'city' && venueCity && venueState) {
      if (artist.city?.toLowerCase() !== venueCity.toLowerCase() || artist.state !== venueState) {
        return false;
      }
    }

    if (region === 'state' && venueState) {
      if (artist.state !== venueState) {
        return false;
      }
    }

    const baseCache = artist.baseCacheCents ?? 0;

    if (budgetRange === 'up_to_300' && baseCache > 30000) {
      return false;
    }

    if (budgetRange === 'between_300_600' && (baseCache < 30000 || baseCache > 60000)) {
      return false;
    }

    if (budgetRange === 'above_600' && baseCache < 60000) {
      return false;
    }

    if (distanceScope === 'within_artist_radius') {
      if (artist.isWithinTravelRadius !== true) {
        return false;
      }
    }

    if (distanceScope === 'up_to_25') {
      if (artist.distanceKm === null || artist.distanceKm > 25) {
        return false;
      }
    }

    if (distanceScope === 'up_to_50') {
      if (artist.distanceKm === null || artist.distanceKm > 50) {
        return false;
      }
    }

    if (!normalizedSearch) {
      return true;
    }

    const haystack = [
      artist.stageName,
      artist.artistCategory,
      artist.city,
      artist.state,
      artist.bio,
      ...artist.genres,
    ]
      .filter((value): value is string => Boolean(value))
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalizedSearch);
  });
}

function formatCacheLabel(value: number | null) {
  if (value === null) {
    return 'Cache a combinar';
  }

  return new Intl.NumberFormat('pt-BR', {
    currency: 'BRL',
    style: 'currency',
  }).format(value / 100);
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  body: {
    flex: 1,
    position: 'relative',
  },
  content: {
    gap: spacing.lg,
    paddingBottom: 132,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  sectionEyebrow: {
    ...typography.label,
    color: colors.secondary,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.onSurface,
  },
  sectionCopy: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
  },
  filterEyebrow: {
    ...typography.label,
    color: colors.secondary,
  },
  filterTitle: {
    ...typography.bodyBold,
    color: colors.onSurface,
  },
  filterWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterPill: {
    backgroundColor: colors.surfaceVariant,
    borderColor: 'transparent',
    borderRadius: radii.pill,
    borderWidth: 1,
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterPillText: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
  },
  filterPillTextActive: {
    color: colors.onPrimaryFixed,
  },
  resultHeader: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  resultMeta: {
    ...typography.label,
    color: colors.secondary,
  },
  cardPressable: {
    borderRadius: radii.lg,
  },
  cardPressed: {
    opacity: 0.92,
  },
  artistCard: {
    gap: spacing.md,
  },
  artistTop: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  artistImage: {
    borderRadius: radii.lg,
    height: 92,
    width: 92,
  },
  artistCopy: {
    flex: 1,
    gap: 4,
  },
  artistTitleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  artistTitle: {
    ...typography.cardTitle,
    color: colors.onSurface,
    flex: 1,
  },
  artistMeta: {
    ...typography.bodyMedium,
    color: colors.secondary,
  },
  artistBio: {
    ...typography.body,
    color: colors.onSurfaceVariant,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metaChip: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  metaChipSecondary: {
    backgroundColor: 'rgba(0,238,252,0.14)',
  },
  metaChipPrimary: {
    backgroundColor: 'rgba(243,255,202,0.14)',
  },
  metaChipText: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
  },
  metaChipPrimaryText: {
    ...typography.bodyMedium,
    color: colors.primary,
  },
  metaChipSecondaryText: {
    ...typography.bodyMedium,
    color: colors.secondary,
  },
  artistBottom: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceLabel: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  detailLink: {
    ...typography.label,
    color: colors.secondary,
  },
  ratingPill: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radii.sm,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ratingText: {
    ...typography.bodyBold,
    color: colors.onSurface,
    fontSize: 12,
  },
  loadingRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  loadingImage: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radii.lg,
    height: 92,
    width: 92,
  },
  loadingCopy: {
    flex: 1,
    gap: spacing.sm,
  },
  loadingBlock: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radii.pill,
    height: 18,
    width: '52%',
  },
  loadingMedium: {
    width: '72%',
  },
  loadingWide: {
    width: '100%',
  },
  loadingAction: {
    height: 42,
  },
});
