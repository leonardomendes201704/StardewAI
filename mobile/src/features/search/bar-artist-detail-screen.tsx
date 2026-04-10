import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import {
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  type ArtistReviewRecord,
  useBarArtistDetail,
} from '@/src/features/search/bar-artist-search';
import { type ProfileMediaAsset } from '@/src/features/profiles/profile-media';
import {
  buildPublicMusicianTrustSignals,
  ProfileTrustSignalsCard,
} from '@/src/features/reputation/profile-reputation';
import { BottomNav, GhostButton, GlassCard, GlowButton, ImageUri, TopBar } from '@/src/shared/components';
import { formatDistanceKm } from '@/src/shared/lib/geolocation';
import { colors, radii, spacing, typography } from '@/src/shared/theme';

const defaultArtistImage =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCrt1x9MZ1YV-DOzUUTG9KuJgd7GOkSWSdo8aLxGeNdkKKBVX9agul9JOWv2lyEEBHZR_iqysSY0CCS4acK0sg1yRpUYrcZYrBbhAcbTY63lGvuzyG6oiYZf503WKqF4fVAIAaHXjR1zxps2keXJcWzAs3ZI7avUQOkhELUjUd29OPwFNObgoj4pMTMMVzR4J6eRH2Jxt3bd8CHLmiLsArY8rCjVX6rG_jCvdOwv6S42wNB0bv1FhPvEuAfVCVefpuxPDBodSKxpRxG';

export function BarArtistDetailScreen({ artistId }: { artistId?: string }) {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const detailQuery = useBarArtistDetail(artistId);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  if (!artistId) {
    return (
      <SafeAreaView edges={['left', 'right']} style={styles.screen}>
        <TopBar leftIcon="arrow-back" onLeftPress={() => router.back()} title="Perfil do artista" />
        <View style={styles.body}>
          <View style={styles.contentWrap}>
            <GlassCard padding={spacing.xl} surface="panel">
              <Text style={styles.sectionEyebrow}>Perfil indisponivel</Text>
              <Text style={styles.sectionTitle}>Nao foi possivel identificar este artista.</Text>
              <Text style={styles.sectionCopy}>Volte para a busca e abra o perfil novamente.</Text>
            </GlassCard>
          </View>
          <BottomNav accountType="bar" active="search" />
        </View>
      </SafeAreaView>
    );
  }

  if (detailQuery.isLoading && !detailQuery.data) {
    return (
      <SafeAreaView edges={['left', 'right']} style={styles.screen}>
        <TopBar leftIcon="arrow-back" onLeftPress={() => router.back()} title="Perfil do artista" />
        <View style={styles.body}>
          <ScrollView contentContainerStyle={styles.content} scrollEnabled={false}>
            <GlassCard padding={0} style={styles.heroCard} surface="panel">
              <View style={styles.loadingHero} />
              <View style={styles.heroContent}>
                <LoadingBlock style={styles.loadingTitle} />
                <LoadingBlock style={styles.loadingWide} />
              </View>
            </GlassCard>
            <LoadingSection />
            <LoadingSection />
          </ScrollView>
          <BottomNav accountType="bar" active="search" />
        </View>
      </SafeAreaView>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <SafeAreaView edges={['left', 'right']} style={styles.screen}>
        <TopBar leftIcon="arrow-back" onLeftPress={() => router.back()} title="Perfil do artista" />
        <View style={styles.body}>
          <View style={styles.contentWrap}>
            <GlassCard padding={spacing.xl} surface="panel">
              <Text style={styles.sectionEyebrow}>Erro</Text>
              <Text style={styles.sectionTitle}>Nao foi possivel abrir esse perfil.</Text>
              <Text style={styles.sectionCopy}>
                {detailQuery.error instanceof Error
                  ? detailQuery.error.message
                  : 'Tente voltar para a busca e abrir novamente.'}
              </Text>
            </GlassCard>
          </View>
          <BottomNav accountType="bar" active="search" />
        </View>
      </SafeAreaView>
    );
  }

  const { artist, mediaAssets, reviews } = detailQuery.data;
  const galleryCardWidth = Math.max(screenWidth - spacing.lg * 2, 280);
  const trustSignals = buildPublicMusicianTrustSignals({
    genreCount: artist.genres.length,
    hasBaseContext: Boolean(artist.city || artist.state || artist.performanceRadiusKm !== null),
    hasCommercialProfile: Boolean(
      artist.artistCategory || artist.baseCacheCents !== null || artist.genres.length > 0,
    ),
    mediaCount: mediaAssets.length,
    totalReviews: artist.ratingCount,
  });

  async function handleOpenInstagram(handle: string) {
    const normalizedHandle = normalizeInstagramHandle(handle);
    const appUrl = `instagram://user?username=${encodeURIComponent(normalizedHandle)}`;
    const webUrl = `https://www.instagram.com/${encodeURIComponent(normalizedHandle)}/`;
    await openExternalUrl(appUrl, webUrl);
  }

  async function handleOpenYoutube(url: string) {
    const appUrl = buildYoutubeAppUrl(url);
    await openExternalUrl(appUrl, url);
  }

  function handleGalleryScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const nextIndex = Math.round(
      event.nativeEvent.contentOffset.x / (galleryCardWidth + spacing.md),
    );
    setGalleryIndex(Math.max(0, Math.min(nextIndex, Math.max(mediaAssets.length - 1, 0))));
  }

  function handleViewerScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
    setViewerIndex(Math.max(0, Math.min(nextIndex, Math.max(mediaAssets.length - 1, 0))));
  }

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.screen}>
      <TopBar leftIcon="arrow-back" onLeftPress={() => router.back()} title="Perfil do artista" />

      <View style={styles.body}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <GlassCard padding={0} style={styles.heroCard} surface="panel">
            <View style={styles.heroImageWrap}>
              <ImageUri source={artist.coverImageUrl ?? defaultArtistImage} style={styles.heroImage} />
              <View style={styles.ratingBadge}>
                <StarRating rating={artist.ratingAverage ?? 0} size={16} />
                <Text style={styles.ratingBadgeText}>
                  {artist.ratingAverage !== null ? artist.ratingAverage.toFixed(1) : 'Sem nota'}
                </Text>
              </View>
            </View>

            <View style={styles.heroContent}>
              <Text style={styles.sectionEyebrow}>Busca ativa</Text>
              <Text style={styles.heroTitle}>{artist.stageName}</Text>
              <Text style={styles.heroMeta}>
                {[artist.artistCategory, artist.city, artist.state].filter(Boolean).join(' - ') ||
                  'Perfil publico do musico'}
              </Text>
              <View style={styles.chipRow}>
                {artist.genres.map((genre) => (
                  <MetaChip key={`${artist.artistId}-${genre}`} label={genre} />
                ))}
                {artist.performanceRadiusKm !== null ? (
                  <MetaChip label={`Raio ${artist.performanceRadiusKm} km`} tone="secondary" />
                ) : null}
              </View>
            </View>
          </GlassCard>

          <DetailSection
            eyebrow="Dados principais"
            title="Leitura rapida do posicionamento artistico e da faixa de contratacao.">
            {artist.artistCategory ? (
              <MetaLine icon="music-note" label="Categoria" value={artist.artistCategory} />
            ) : null}
            <MetaLine icon="payments" label="Cache base" value={formatCurrency(artist.baseCacheCents)} />
            {artist.city || artist.state ? (
              <MetaLine
                icon="place"
                label="Base"
                value={[artist.city, artist.state].filter(Boolean).join('/')}
              />
            ) : null}
            {artist.performanceRadiusKm !== null ? (
              <MetaLine icon="route" label="Raio de atuacao" value={`${artist.performanceRadiusKm} km`} />
            ) : null}
            {artist.distanceKm !== null ? (
              <MetaLine
                icon="social-distance"
                label="Distancia da casa"
                value={formatDistanceKm(artist.distanceKm) ?? ''}
              />
            ) : null}
            {artist.isWithinTravelRadius !== null ? (
              <MetaLine
                icon="verified"
                label="Alcance"
                value={artist.isWithinTravelRadius ? 'Dentro do raio informado' : 'Fora do raio informado'}
              />
            ) : null}
          </DetailSection>

          <ProfileTrustSignalsCard
            eyebrow="Sinais de confianca"
            signals={trustSignals}
            title="Indicadores objetivos publicados por este artista para reduzir incerteza antes do convite."
          />

          {mediaAssets.length > 0 ? (
            <DetailSection
              eyebrow="Portfolio visual"
              title="Passe pelas fotos publicas e toque para abrir em tela cheia.">
              <ScrollView
                contentContainerStyle={styles.galleryRow}
                decelerationRate="fast"
                horizontal
                onMomentumScrollEnd={handleGalleryScroll}
                showsHorizontalScrollIndicator={false}
                snapToAlignment="start"
                snapToInterval={galleryCardWidth + spacing.md}>
                {mediaAssets.map((asset, index) => (
                  <Pressable
                    key={asset.id}
                    onPress={() => setViewerIndex(index)}
                    style={({ pressed }) => [
                      styles.galleryCard,
                      { width: galleryCardWidth },
                      pressed && styles.pressedCard,
                    ]}>
                    <Image source={{ uri: asset.publicUrl }} style={styles.galleryImage} />
                    <View style={styles.galleryOverlay}>
                      <Text style={styles.galleryOverlayLabel}>
                        Foto {index + 1} de {mediaAssets.length}
                      </Text>
                      <MaterialIcons color={colors.onSurface} name="open-in-full" size={18} />
                    </View>
                  </Pressable>
                ))}
              </ScrollView>

              {mediaAssets.length > 1 ? (
                <View style={styles.galleryDots}>
                  {mediaAssets.map((asset, index) => (
                    <View
                      key={`${asset.id}-dot`}
                      style={[styles.galleryDot, index === galleryIndex && styles.galleryDotActive]}
                    />
                  ))}
                </View>
              ) : null}
            </DetailSection>
          ) : null}

          <DetailSection eyebrow="Bio e estrutura" title="O que este artista leva para o palco e para a contratacao.">
            <CopyBlock
              title="Bio"
              value={artist.bio || 'O artista ainda nao publicou uma bio detalhada.'}
            />
            <CopyBlock
              title="Estrutura"
              value={
                artist.structureSummary ||
                'Ainda nao ha detalhes publicos sobre rider, formato ou estrutura.'
              }
            />
            <CopyBlock
              title="Repertorio"
              value={
                artist.repertoireSummary ||
                'O repertorio ainda nao foi detalhado neste perfil publico.'
              }
            />
          </DetailSection>

          <DetailSection eyebrow="Links publicos" title="Canais externos para validar presenca digital e material.">
            {artist.instagramHandle ? (
              <MetaLine
                icon="alternate-email"
                label="Instagram"
                onPress={() => handleOpenInstagram(artist.instagramHandle ?? '')}
                value={artist.instagramHandle}
              />
            ) : null}
            {artist.youtubeUrl ? (
              <MetaLine
                icon="play-circle-filled"
                label="Video"
                onPress={() => handleOpenYoutube(artist.youtubeUrl ?? '')}
                value={artist.youtubeUrl}
              />
            ) : null}
            {!artist.instagramHandle && !artist.youtubeUrl ? (
              <Text style={styles.sectionCopy}>Este artista ainda nao publicou links externos.</Text>
            ) : null}
          </DetailSection>

          <DetailSection eyebrow="Reputacao" title="Como outros bares avaliaram a experiencia de contratacao deste artista.">
            {artist.ratingCount > 0 ? (
              <>
                <GlassCard padding={spacing.lg} style={styles.reviewSummaryCard} surface="panel">
                  <View style={styles.reviewSummaryTop}>
                    <Text style={styles.reviewAverageValue}>
                      {formatReviewAverageValue(artist.ratingAverage ?? 0)}
                    </Text>
                    <View style={styles.reviewSummaryCopy}>
                      <StarRating rating={artist.ratingAverage ?? 0} size={18} />
                      <Text style={styles.reviewSummaryMeta}>
                        {formatReviewCountLabel(artist.ratingCount)}
                      </Text>
                    </View>
                  </View>
                </GlassCard>

                <View style={styles.reviewList}>
                  {reviews.map((review) => (
                    <GlassCard key={review.id} padding={spacing.lg} style={styles.reviewCard} surface="panel">
                      <View style={styles.reviewCardHeader}>
                        <View style={styles.reviewIdentity}>
                          <Text style={styles.reviewAuthorName}>{review.reviewer_name}</Text>
                          {review.reviewer_city ? (
                            <Text style={styles.reviewAuthorMeta}>{review.reviewer_city}</Text>
                          ) : null}
                        </View>
                        <StarRating rating={review.rating} size={16} />
                      </View>
                      <Text style={styles.reviewComment}>{review.comment}</Text>
                      <Text style={styles.reviewFooter}>{formatReviewDateLabel(review.created_at)}</Text>
                    </GlassCard>
                  ))}
                </View>
              </>
            ) : (
              <Text style={styles.sectionCopy}>Este artista ainda nao possui avaliacoes publicas.</Text>
            )}
          </DetailSection>

          <GlassCard padding={spacing.lg} surface="panel">
            <Text style={styles.sectionEyebrow}>Proximo passo</Text>
            <Text style={styles.sectionTitle}>Convide este artista direto do perfil publico.</Text>
            <Text style={styles.sectionCopy}>
              Escolha uma vaga existente para convidar {artist.stageName} agora ou crie uma nova vaga e volte ja no fluxo guiado.
            </Text>
            <GlowButton
              icon="campaign"
              label="Selecionar vaga para convite"
              onPress={() => router.push(`/bar/invite/${artist.artistId}`)}
            />
            <GhostButton
              icon="add-circle"
              label="Criar vaga e convidar"
              onPress={() => router.push(`/bar/opportunities/new?inviteArtistId=${artist.artistId}`)}
            />
          </GlassCard>
        </ScrollView>

        <BottomNav accountType="bar" active="search" />
      </View>

      <ArtistGalleryViewer
        assets={mediaAssets}
        onClose={() => setViewerIndex(null)}
        onMomentumScrollEnd={handleViewerScroll}
        screenWidth={screenWidth}
        visible={viewerIndex !== null}
        viewerIndex={viewerIndex}
      />
    </SafeAreaView>
  );
}

function ArtistGalleryViewer({
  assets,
  onClose,
  onMomentumScrollEnd,
  screenWidth,
  visible,
  viewerIndex,
}: {
  assets: ProfileMediaAsset[];
  onClose: () => void;
  onMomentumScrollEnd: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  screenWidth: number;
  visible: boolean;
  viewerIndex: number | null;
}) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.viewerBackdrop}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.viewerSafeArea}>
          <View style={styles.viewerHeader}>
            <GhostButton icon="close" label="Fechar" onPress={onClose} />
            <Text style={styles.viewerMeta}>
              {viewerIndex !== null ? `Foto ${viewerIndex + 1} de ${assets.length}` : ''}
            </Text>
          </View>

          <ScrollView
            contentOffset={{ x: (viewerIndex ?? 0) * screenWidth, y: 0 }}
            horizontal
            key={`viewer-${viewerIndex ?? 0}-${assets.length}`}
            onMomentumScrollEnd={onMomentumScrollEnd}
            pagingEnabled
            showsHorizontalScrollIndicator={false}>
            {assets.map((asset) => (
              <View key={`${asset.id}-viewer`} style={[styles.viewerSlide, { width: screenWidth }]}>
                <Image resizeMode="contain" source={{ uri: asset.publicUrl }} style={styles.viewerImage} />
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function DetailSection({
  children,
  eyebrow,
  title,
}: {
  children: ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <GlassCard padding={spacing.xl} style={styles.sectionCard} surface="panel">
      <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </GlassCard>
  );
}

function MetaLine({
  icon,
  label,
  onPress,
  value,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress?: () => void;
  value: string;
}) {
  const content = (
    <View style={styles.metaLine}>
      <View style={styles.metaIconWrap}>
        <MaterialIcons color={colors.secondary} name={icon} size={18} />
      </View>
      <View style={styles.metaCopy}>
        <Text style={styles.metaLabel}>{label}</Text>
        <Text style={[styles.metaValue, onPress && styles.metaValueLink]}>{value}</Text>
      </View>
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressedCard]}>
      {content}
    </Pressable>
  );
}

function CopyBlock({ title, value }: { title: string; value: string }) {
  return (
    <View style={styles.copyBlock}>
      <Text style={styles.copyTitle}>{title}</Text>
      <Text style={styles.copyText}>{value}</Text>
    </View>
  );
}

function MetaChip({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'secondary' }) {
  return (
    <View style={[styles.metaChip, tone === 'secondary' && styles.metaChipSecondary]}>
      <Text style={[styles.metaChipText, tone === 'secondary' && styles.metaChipTextSecondary]}>{label}</Text>
    </View>
  );
}

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  const filledStars = Math.round(rating);

  return (
    <View style={styles.starRow}>
      {Array.from({ length: 5 }, (_, index) => (
        <MaterialIcons
          color={index < filledStars ? colors.primary : colors.outlineVariant}
          key={`star-${index + 1}`}
          name={index < filledStars ? 'star' : 'star-border'}
          size={size}
        />
      ))}
    </View>
  );
}

function formatCurrency(value: number | null) {
  if (value === null) {
    return 'Cache a combinar';
  }

  return new Intl.NumberFormat('pt-BR', {
    currency: 'BRL',
    style: 'currency',
  }).format(value / 100);
}

function formatReviewAverageValue(value: number) {
  return value.toFixed(1).replace('.', ',');
}

function formatReviewCountLabel(count: number) {
  return count === 1 ? '1 avaliacao publica' : `${count} avaliacoes publicas`;
}

function formatReviewDateLabel(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

async function openExternalUrl(preferredUrl: string, fallbackUrl: string) {
  if (preferredUrl) {
    const supported = await Linking.canOpenURL(preferredUrl);

    if (supported) {
      await Linking.openURL(preferredUrl);
      return;
    }
  }

  await Linking.openURL(fallbackUrl);
}

function normalizeInstagramHandle(value: string) {
  return value.replace(/^@+/, '').trim();
}

function buildYoutubeAppUrl(value: string) {
  try {
    const parsedUrl = new URL(value);

    if (parsedUrl.hostname.includes('youtu.be')) {
      return `vnd.youtube://${parsedUrl.pathname.replace('/', '')}`;
    }

    if (parsedUrl.hostname.includes('youtube.com')) {
      return `vnd.youtube://${parsedUrl.searchParams.get('v') ?? ''}`;
    }
  } catch {
    return value;
  }

  return value;
}

function LoadingSection() {
  return (
    <GlassCard padding={spacing.xl} style={styles.sectionCard} surface="panel">
      <LoadingBlock style={styles.loadingTitle} />
      <LoadingBlock style={styles.loadingWide} />
      <LoadingBlock style={styles.loadingMeta} />
    </GlassCard>
  );
}

function LoadingBlock({ style }: { style?: object }) {
  return <View style={[styles.loadingBlock, style]} />;
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  body: {
    flex: 1,
  },
  content: {
    gap: spacing.lg,
    paddingBottom: 132,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  contentWrap: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  heroCard: {
    overflow: 'hidden',
  },
  heroImageWrap: {
    height: 236,
    overflow: 'hidden',
    position: 'relative',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    height: undefined,
    width: undefined,
  },
  ratingBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderRadius: radii.pill,
    bottom: spacing.md,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    position: 'absolute',
    right: spacing.md,
  },
  ratingBadgeText: {
    ...typography.label,
    color: colors.onSurface,
  },
  heroContent: {
    gap: spacing.md,
    padding: spacing.xl,
  },
  sectionCard: {
    gap: spacing.md,
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
  heroTitle: {
    ...typography.screenTitle,
    color: colors.onSurface,
  },
  heroMeta: {
    ...typography.bodyMedium,
    color: colors.secondary,
  },
  chipRow: {
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
  metaChipText: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
  },
  metaChipTextSecondary: {
    color: colors.secondary,
  },
  metaLine: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metaIconWrap: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.md,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  metaCopy: {
    flex: 1,
    gap: 2,
  },
  metaLabel: {
    ...typography.label,
    color: colors.onSurfaceVariant,
  },
  metaValue: {
    ...typography.bodyBold,
    color: colors.onSurface,
  },
  metaValueLink: {
    color: colors.secondary,
  },
  galleryRow: {
    gap: spacing.md,
    paddingRight: spacing.sm,
  },
  galleryCard: {
    aspectRatio: 1.18,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  pressedCard: {
    opacity: 0.9,
  },
  galleryImage: {
    ...StyleSheet.absoluteFillObject,
    height: undefined,
    width: undefined,
  },
  galleryOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(13,13,22,0.62)',
    borderRadius: radii.pill,
    bottom: spacing.md,
    flexDirection: 'row',
    gap: spacing.xs,
    left: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    position: 'absolute',
  },
  galleryOverlayLabel: {
    ...typography.bodyMedium,
    color: colors.onSurface,
  },
  galleryDots: {
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
  },
  galleryDot: {
    backgroundColor: colors.outlineVariant,
    borderRadius: radii.pill,
    height: 8,
    width: 8,
  },
  galleryDotActive: {
    backgroundColor: colors.primaryContainer,
    width: 22,
  },
  copyBlock: {
    gap: spacing.xs,
  },
  copyTitle: {
    ...typography.bodyBold,
    color: colors.onSurface,
  },
  copyText: {
    ...typography.body,
    color: colors.onSurfaceVariant,
  },
  reviewSummaryCard: {
    gap: spacing.sm,
  },
  reviewSummaryTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.lg,
  },
  reviewAverageValue: {
    ...typography.screenTitle,
    color: colors.primary,
    fontSize: 42,
    lineHeight: 46,
  },
  reviewSummaryCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  reviewSummaryMeta: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
  },
  reviewList: {
    gap: spacing.md,
  },
  reviewCard: {
    gap: spacing.sm,
  },
  reviewCardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  reviewIdentity: {
    flex: 1,
    gap: 2,
  },
  reviewAuthorName: {
    ...typography.bodyBold,
    color: colors.onSurface,
  },
  reviewAuthorMeta: {
    ...typography.label,
    color: colors.onSurfaceVariant,
  },
  reviewComment: {
    ...typography.body,
    color: colors.onSurface,
  },
  reviewFooter: {
    ...typography.label,
    color: colors.onSurfaceVariant,
  },
  starRow: {
    flexDirection: 'row',
    gap: 2,
  },
  viewerBackdrop: {
    backgroundColor: 'rgba(6,6,10,0.96)',
    flex: 1,
  },
  viewerSafeArea: {
    flex: 1,
  },
  viewerHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  viewerMeta: {
    ...typography.bodyMedium,
    color: colors.onSurface,
  },
  viewerSlide: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerImage: {
    height: '100%',
    width: '100%',
  },
  loadingHero: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    height: 236,
  },
  loadingBlock: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radii.pill,
    height: 18,
  },
  loadingTitle: {
    height: 30,
    width: '58%',
  },
  loadingWide: {
    width: '92%',
  },
  loadingMeta: {
    width: '70%',
  },
});
