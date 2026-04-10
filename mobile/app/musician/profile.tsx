import { MaterialIcons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthSession } from '@/src/features/auth/auth-provider';
import {
  ARTIST_MEDIA_LIMIT,
  useDeleteArtistMedia,
  useUploadArtistMedia,
  type ProfileMediaAsset,
} from '@/src/features/profiles/profile-media';
import {
  useArtistProfileEditor,
  usePostalCodeLookup,
  useSaveArtistProfile,
} from '@/src/features/profiles/profile-editor';
import {
  buildStripeConnectedAccountStatusCopy,
  formatStripeConnectedAccountStatusLabel,
  useCreateMusicianConnectOnboardingLink,
  useMusicianStripeConnectSnapshot,
  useSyncMusicianConnectAccount,
  type MusicianStripeConnectSnapshot,
  type StripeConnectedAccountStatus,
} from '@/src/features/payments/payments';
import { NotificationPreferencesCard } from '@/src/features/notifications/notification-preferences-card';
import {
  buildMusicianTrustSignals,
  ProfileReputationCard,
  ProfileTrustSignalsCard,
  useArtistProfileReputation,
} from '@/src/features/reputation/profile-reputation';
import {
  Badge,
  BottomNav,
  GhostButton,
  GlassCard,
  GlowButton,
  ImageUri,
  InputField,
  getBottomNavStickyActionOffset,
} from '@/src/shared/components';
import { colors, radii, spacing, typography } from '@/src/shared/theme';

const defaultHeroImage =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCrt1x9MZ1YV-DOzUUTG9KuJgd7GOkSWSdo8aLxGeNdkKKBVX9agul9JOWv2lyEEBHZR_iqysSY0CCS4acK0sg1yRpUYrcZYrBbhAcbTY63lGvuzyG6oiYZf503WKqF4fVAIAaHXjR1zxps2keXJcWzAs3ZI7avUQOkhELUjUd29OPwFNObgoj4pMTMMVzR4J6eRH2Jxt3bd8CHLmiLsArY8rCjVX6rG_jCvdOwv6S42wNB0bv1FhPvEuAfVCVefpuxPDBodSKxpRxG';

type MusicianProfileFormState = {
  artistCategory: string;
  baseCache: string;
  bio: string;
  city: string;
  instagramHandle: string;
  performanceRadius: string;
  postalCode: string;
  repertoireSummary: string;
  selectedGenreIds: number[];
  stageName: string;
  state: string;
  structureSummary: string;
  youtubeUrl: string;
};

const EMPTY_FORM: MusicianProfileFormState = {
  artistCategory: '',
  baseCache: '',
  bio: '',
  city: '',
  instagramHandle: '',
  performanceRadius: '',
  postalCode: '',
  repertoireSummary: '',
  selectedGenreIds: [],
  stageName: '',
  state: '',
  structureSummary: '',
  youtubeUrl: '',
};

const DEFAULT_CONNECT_SNAPSHOT: MusicianStripeConnectSnapshot = {
  accountId: null,
  lastConnectSyncAt: null,
  lastPayoutAttemptAt: null,
  onboardingCompletedAt: null,
  payoutsCapabilityStatus: null,
  requirementsDisabledReason: null,
  requirementsDue: [],
  requirementsPending: [],
  status: 'not_started',
  transfersCapabilityStatus: null,
};

export default function MusicianProfileScreen() {
  const insets = useSafeAreaInsets();
  const stickyActionBottom = getBottomNavStickyActionOffset(insets.bottom);
  const router = useRouter();
  const { signOut, user } = useAuthSession();
  const profileQuery = useArtistProfileEditor();
  const reputationQuery = useArtistProfileReputation();
  const connectQuery = useMusicianStripeConnectSnapshot();
  const createConnectOnboarding = useCreateMusicianConnectOnboardingLink();
  const syncConnectAccount = useSyncMusicianConnectAccount();
  const saveProfile = useSaveArtistProfile();
  const uploadArtistMedia = useUploadArtistMedia();
  const deleteArtistMedia = useDeleteArtistMedia();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [form, setForm] = useState<MusicianProfileFormState>(EMPTY_FORM);
  const postalCodeLookup = usePostalCodeLookup(form.postalCode);

  useEffect(() => {
    if (!profileQuery.data) {
      return;
    }

    const { artistProfile, selectedGenreIds } = profileQuery.data;

    setForm({
      artistCategory: artistProfile?.artist_category ?? '',
      baseCache: formatCurrencyInput(artistProfile?.base_cache_cents ?? null),
      bio: artistProfile?.bio ?? '',
      city: artistProfile?.city ?? '',
      instagramHandle: artistProfile?.instagram_handle ?? '',
      performanceRadius:
        artistProfile?.performance_radius_km !== null &&
        artistProfile?.performance_radius_km !== undefined
          ? String(artistProfile.performance_radius_km)
          : '',
      postalCode: formatPostalCodeInput(artistProfile?.postal_code ?? ''),
      repertoireSummary: artistProfile?.repertoire_summary ?? '',
      selectedGenreIds,
      stageName: artistProfile?.stage_name ?? '',
      state: artistProfile?.state ?? '',
      structureSummary: artistProfile?.structure_summary ?? '',
      youtubeUrl: artistProfile?.youtube_url ?? '',
    });
  }, [profileQuery.data]);

  const mediaAssets = profileQuery.data?.mediaAssets ?? [];

  useEffect(() => {
    if (!postalCodeLookup.data) {
      return;
    }

    setForm((current) => {
      const currentPostalCode = extractPostalCodeDigits(current.postalCode);

      if (currentPostalCode !== postalCodeLookup.data.postalCode) {
        return current;
      }

      if (current.city === postalCodeLookup.data.city && current.state === postalCodeLookup.data.state) {
        return current;
      }

      return {
        ...current,
        city: postalCodeLookup.data.city,
        state: postalCodeLookup.data.state,
      };
    });
  }, [postalCodeLookup.data]);

  async function handleSave() {
    setErrorMessage(null);
    setFeedback(null);

    const postalCodeDigits = extractPostalCodeDigits(form.postalCode);

    if (postalCodeDigits.length > 0 && postalCodeDigits.length < 8) {
      setErrorMessage('Informe um CEP valido com 8 digitos para preencher a localizacao.');
      return;
    }

    if (postalCodeDigits.length === 8 && postalCodeLookup.isFetching) {
      setErrorMessage('Aguarde a consulta do CEP terminar antes de salvar.');
      return;
    }

    if (postalCodeDigits.length === 8 && postalCodeLookup.isError) {
      setErrorMessage(postalCodeLookup.error.message);
      return;
    }

    if (postalCodeDigits.length === 8 && (!form.city.trim() || !form.state.trim())) {
      setErrorMessage('Nao foi possivel preencher cidade e UF a partir deste CEP.');
      return;
    }

    try {
      await saveProfile.mutateAsync({
        artistCategory: form.artistCategory,
        baseCacheCents: parseCurrencyToCents(form.baseCache),
        bio: form.bio,
        city: form.city,
        instagramHandle: form.instagramHandle,
        performanceRadiusKm: parseInteger(form.performanceRadius),
        postalCode: form.postalCode,
        repertoireSummary: form.repertoireSummary,
        selectedGenreIds: form.selectedGenreIds,
        stageName: form.stageName,
        state: form.state,
        structureSummary: form.structureSummary,
        youtubeUrl: form.youtubeUrl,
      });

      setFeedback(
        isMusicianProfileComplete(form)
          ? 'Perfil do Musico salvo e marcado como completo.'
          : 'Perfil salvo como rascunho. Falta fechar nome artistico, categoria, CEP, cache e pelo menos um genero.',
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Nao foi possivel salvar o perfil.');
    }
  }

  async function handleAddMedia() {
    setErrorMessage(null);
    setFeedback(null);

    try {
      const uploadedCount = await uploadArtistMedia.mutateAsync({
        nextSortOrder: getNextSortOrder(mediaAssets),
        selectionLimit: ARTIST_MEDIA_LIMIT - mediaAssets.length,
      });

      if (uploadedCount > 0) {
        setFeedback(
          uploadedCount === 1
            ? '1 foto foi adicionada ao portfolio do Musico.'
            : `${uploadedCount} fotos foram adicionadas ao portfolio do Musico.`,
        );
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Nao foi possivel enviar as fotos do portfolio.',
      );
    }
  }

  async function handleRemoveMedia(asset: ProfileMediaAsset) {
    setErrorMessage(null);
    setFeedback(null);

    try {
      await deleteArtistMedia.mutateAsync({
        assetId: asset.id,
        storagePath: asset.storagePath,
      });
      setFeedback('Foto removida do portfolio do Musico.');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Nao foi possivel remover a foto do portfolio.',
      );
    }
  }

  async function handleSignOut() {
    await signOut();
    router.replace('/');
  }

  async function handleConnectOnboarding() {
    setErrorMessage(null);
    setFeedback(null);

    try {
      const payload = await createConnectOnboarding.mutateAsync();

      if (payload.alreadyReady || payload.snapshot.status === 'ready') {
        setFeedback('Sua conta Stripe ja esta pronta para receber repasses.');
        return;
      }

      if (!payload.onboardingUrl) {
        throw new Error('A Stripe nao retornou um link de onboarding para continuar.');
      }

      await Linking.openURL(payload.onboardingUrl);
      setFeedback(
        'Onboarding Stripe aberto. Depois de concluir no navegador, volte ao app e toque em Atualizar status.',
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Nao foi possivel abrir o onboarding Stripe do recebimento.',
      );
    }
  }

  async function handleSyncConnectAccount() {
    setErrorMessage(null);
    setFeedback(null);

    try {
      const payload = await syncConnectAccount.mutateAsync();

      setFeedback(
        payload.snapshot.status === 'ready'
          ? 'Recebimento Stripe sincronizado. Sua conta ja esta pronta para receber repasses.'
          : 'Status Stripe atualizado. Se ainda houver pendencias, conclua o onboarding e sincronize novamente.',
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Nao foi possivel atualizar o status do recebimento Stripe.',
      );
    }
  }

  if (profileQuery.isLoading && !profileQuery.data) {
    return <MusicianProfileLoadingState stickyActionBottom={stickyActionBottom} />;
  }

  const account = profileQuery.data?.account;
  const connectSnapshot = connectQuery.data ?? DEFAULT_CONNECT_SNAPSHOT;
  const isMutatingMedia = uploadArtistMedia.isPending || deleteArtistMedia.isPending;
  const genres = profileQuery.data?.genres ?? [];
  const postalCodeDigits = extractPostalCodeDigits(form.postalCode);
  const heroImageSource = mediaAssets[0]?.publicUrl ?? defaultHeroImage;
  const selectedGenreLabels = genres
    .filter((genre) => form.selectedGenreIds.includes(genre.id))
    .map((genre) => genre.name);
  const trustSignals = buildMusicianTrustSignals({
    city: form.city,
    completedContracts: reputationQuery.data?.completedContracts ?? 0,
    genreCount: form.selectedGenreIds.length,
    mediaCount: mediaAssets.length,
    postalCode: form.postalCode,
    profileCompleted: (account?.profile_completed ?? false) || isMusicianProfileComplete(form),
    state: form.state,
    totalReviews: reputationQuery.data?.totalReviews ?? 0,
  });

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.screen}>
      <View style={styles.body}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: stickyActionBottom + 140 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <ImageUri source={heroImageSource} style={styles.heroImage} />
            <LinearGradient
              colors={['rgba(13,13,22,0.18)', 'rgba(13,13,22,0.92)']}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.heroTop}>
              <Text style={styles.brand}>TocaAI</Text>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveLabel}>
                  {account?.profile_completed ? 'Perfil completo' : 'Perfil em rascunho'}
                </Text>
              </View>
            </View>

            <View style={styles.heroBottom}>
              <View style={styles.badges}>
                <View style={styles.genreBadge}>
                  <Text style={styles.genreLabel}>
                    {selectedGenreLabels.slice(0, 2).join(' / ') || 'Escolha seus estilos'}
                  </Text>
                </View>
                <View style={styles.secondaryBadge}>
                  <Text style={styles.secondaryBadgeLabel}>
                    {form.artistCategory.trim() || 'Categoria artistica'}
                  </Text>
                </View>
              </View>

              <Text style={styles.name}>{form.stageName.trim() || 'Seu nome artistico no app'}</Text>

              <View style={styles.metrics}>
                <MetricPill
                  icon="payments"
                  label={form.baseCache.trim() ? `R$ ${form.baseCache}/show` : 'Cache medio pendente'}
                  tone="secondary"
                />
                <MetricPill
                  icon="near-me"
                  label={
                    form.performanceRadius.trim()
                      ? `${form.performanceRadius} km de atuacao`
                      : 'Raio de atuacao pendente'
                  }
                  tone="primary"
                />
              </View>

              <Text style={styles.heroMeta}>{user?.email ?? account?.email ?? 'Sessao ativa'}</Text>
            </View>
          </View>

          <View style={styles.sections}>
            <ProfileTrustSignalsCard
              eyebrow="Confianca do perfil"
              signals={trustSignals}
              title="Selos basicos que mostram preparo operacional, consistencia do portfolio e historico de entrega."
            />

            <ProfileReputationCard
              emptyCopy="As avaliacoes de bares aparecem aqui depois dos primeiros shows concluidos e revisados no app."
              errorMessage={reputationQuery.isError ? reputationQuery.error.message : null}
              eyebrow="Historico de reputacao"
              loading={reputationQuery.isLoading}
              summary={reputationQuery.data}
              title="Como os bares avaliaram sua performance, postura e qualidade de entrega."
            />

            <ProfileSection
              eyebrow="Identidade artistica"
              title="O cartao de visita usado na descoberta e na contratacao.">
              <InputField
                icon="mic"
                onChangeText={(value) => updateForm(setForm, 'stageName', value)}
                placeholder="Nome artistico"
                value={form.stageName}
              />
              <InputField
                icon="piano"
                onChangeText={(value) => updateForm(setForm, 'artistCategory', value)}
                placeholder="Categoria artistica"
                value={form.artistCategory}
              />
            </ProfileSection>

            <ProfileSection
              eyebrow="Estilos musicais"
              title="Selecione os generos que definem seu show hoje.">
              <View style={styles.chipWrap}>
                {genres.map((genre) => (
                  <SelectableChip
                    active={form.selectedGenreIds.includes(genre.id)}
                    key={genre.id}
                    label={genre.name}
                    onPress={() =>
                      setForm((current) => ({
                        ...current,
                        selectedGenreIds: toggleNumericValue(current.selectedGenreIds, genre.id),
                      }))
                    }
                  />
                ))}
              </View>
              {selectedGenreLabels.length > 0 ? (
                <Text style={styles.helperText}>Selecionados: {selectedGenreLabels.join(', ')}</Text>
              ) : null}
            </ProfileSection>

            <ProfileSection
              eyebrow="Atuacao e cache"
              title="CEP base, localizacao automatica e valor medio por show.">
              <InputField
                icon="markunread-mailbox"
                keyboardType="number-pad"
                maxLength={9}
                onChangeText={(value) => handlePostalCodeChange(setForm, value)}
                placeholder="CEP"
                value={form.postalCode}
              />
              <View style={styles.row}>
                <InputField
                  containerStyle={styles.flexInput}
                  editable={false}
                  icon="location-city"
                  placeholder="Cidade preenchida automaticamente"
                  value={form.city}
                />
                <InputField
                  containerStyle={styles.stateInput}
                  editable={false}
                  icon="map"
                  placeholder="UF"
                  value={form.state}
                />
              </View>
              {postalCodeDigits.length === 8 && postalCodeLookup.isFetching ? (
                <Text style={styles.helperText}>Consultando CEP no ViaCEP...</Text>
              ) : null}
              {postalCodeDigits.length === 8 && postalCodeLookup.isError ? (
                <Text style={styles.errorText}>{postalCodeLookup.error.message}</Text>
              ) : null}
              {postalCodeDigits.length === 8 &&
              !postalCodeLookup.isFetching &&
              !postalCodeLookup.isError &&
              form.city.trim() &&
              form.state.trim() ? (
                <Text style={styles.helperText}>
                  Cidade e UF preenchidos automaticamente pelo CEP e bloqueados para edicao.
                </Text>
              ) : null}
              <View style={styles.row}>
                <InputField
                  containerStyle={styles.flexInput}
                  icon="near-me"
                  keyboardType="number-pad"
                  onChangeText={(value) =>
                    updateForm(setForm, 'performanceRadius', onlyDigits(value))
                  }
                  placeholder="Raio em km"
                  value={form.performanceRadius}
                />
                <InputField
                  containerStyle={styles.flexInput}
                  icon="payments"
                  keyboardType="decimal-pad"
                  onChangeText={(value) =>
                    updateForm(setForm, 'baseCache', normalizeCurrencyInput(value))
                  }
                  placeholder="Cache medio em R$"
                  value={form.baseCache}
                />
              </View>
            </ProfileSection>

            <ProfileSection
              eyebrow="Bio e estrutura"
              title="Resumo do show e o que voce leva para o palco.">
              <InputField
                icon="article"
                multiline
                numberOfLines={6}
                onChangeText={(value) => updateForm(setForm, 'bio', value)}
                placeholder="Apresente sua proposta, clima do show e o tipo de evento em que voce rende melhor."
                value={form.bio}
              />
              <InputField
                icon="speaker"
                multiline
                numberOfLines={5}
                onChangeText={(value) => updateForm(setForm, 'structureSummary', value)}
                placeholder="Equipamentos proprios, formato de banda, rider tecnico e observacoes de estrutura."
                value={form.structureSummary}
              />
            </ProfileSection>

            <ProfileSection
              eyebrow="Portfolio e repertorio"
              title="Fotos de palco e repertorio que ajudam o contratante a entender seu material.">
              <View style={styles.mediaHeader}>
                <Text style={styles.helperText}>
                  Adicione ate {ARTIST_MEDIA_LIMIT} fotos do show. A primeira imagem vira o destaque do perfil.
                </Text>
                <GhostButton
                  disabled={uploadArtistMedia.isPending || mediaAssets.length >= ARTIST_MEDIA_LIMIT}
                  icon="add-photo-alternate"
                  label={
                    uploadArtistMedia.isPending
                      ? 'Enviando fotos'
                      : mediaAssets.length >= ARTIST_MEDIA_LIMIT
                        ? 'Limite atingido'
                        : 'Adicionar fotos'
                  }
                  onPress={() => void handleAddMedia()}
                />
              </View>
              {mediaAssets.length > 0 ? (
                <View style={styles.mediaGrid}>
                  {mediaAssets.map((asset, index) => (
                    <MediaCard
                      asset={asset}
                      disabled={deleteArtistMedia.isPending}
                      index={index}
                      key={asset.id}
                      onRemove={() => void handleRemoveMedia(asset)}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.mediaEmptyState}>
                  <MaterialIcons color={colors.outlineVariant} name="photo-library" size={24} />
                  <Text style={styles.mediaEmptyTitle}>Nenhuma foto enviada ainda</Text>
                  <Text style={styles.mediaEmptyCopy}>
                    Envie imagens de palco, bastidor ou press kit para dar contexto visual ao seu perfil.
                  </Text>
                </View>
              )}
              <InputField
                icon="queue-music"
                multiline
                numberOfLines={5}
                onChangeText={(value) => updateForm(setForm, 'repertoireSummary', value)}
                placeholder="Liste artistas, estilos, blocos de repertorio e musicas que costumam entrar no show."
                value={form.repertoireSummary}
              />
            </ProfileSection>

            <ProfileSection
              eyebrow="Presenca digital"
              title="Links publicos que ajudam o contratante a validar seu material.">
              <InputField
                autoCapitalize="none"
                icon="alternate-email"
                onChangeText={(value) => updateForm(setForm, 'instagramHandle', value)}
                placeholder="@seuinstagram"
                value={form.instagramHandle}
              />
              <InputField
                autoCapitalize="none"
                icon="smart-display"
                onChangeText={(value) => updateForm(setForm, 'youtubeUrl', value)}
                placeholder="Link publico de video"
                value={form.youtubeUrl}
              />
            </ProfileSection>

            <ProfileSection
              eyebrow="Recebimento Stripe"
              title="Conecte sua conta para liberar repasses automaticos depois dos shows concluidos.">
              <View style={styles.connectStatusRow}>
                <Badge
                  active
                  label={formatStripeConnectedAccountStatusLabel(connectSnapshot.status)}
                  tone={getStripeConnectTone(connectSnapshot.status)}
                />
                {connectQuery.isFetching ? (
                  <Text style={styles.helperText}>Sincronizando status Stripe...</Text>
                ) : null}
              </View>
              <Text style={styles.helperText}>
                {buildStripeConnectedAccountStatusCopy(connectSnapshot)}
              </Text>
              {connectQuery.isError ? (
                <Text style={styles.errorText}>{connectQuery.error.message}</Text>
              ) : null}
              {connectSnapshot.accountId ? (
                <MetaLine
                  label="Conta conectada"
                  value={formatConnectedAccountReference(connectSnapshot.accountId)}
                />
              ) : null}
              <MetaLine
                label="Transferencias Stripe"
                value={formatStripeCapabilityLabel(
                  connectSnapshot.transfersCapabilityStatus,
                  'Ainda nao habilitadas',
                )}
              />
              <MetaLine
                label="Saques Stripe"
                value={formatStripeCapabilityLabel(
                  connectSnapshot.payoutsCapabilityStatus,
                  'Ainda nao habilitados',
                )}
              />
              {connectSnapshot.lastConnectSyncAt ? (
                <MetaLine
                  label="Ultima sincronizacao"
                  value={new Date(connectSnapshot.lastConnectSyncAt).toLocaleString('pt-BR')}
                />
              ) : null}
              {connectSnapshot.lastPayoutAttemptAt ? (
                <MetaLine
                  label="Ultima tentativa de repasse"
                  value={new Date(connectSnapshot.lastPayoutAttemptAt).toLocaleString('pt-BR')}
                />
              ) : null}
              {connectSnapshot.requirementsDisabledReason ? (
                <View style={styles.reasonCard}>
                  <Text style={styles.reasonLabel}>Pendencia principal da Stripe</Text>
                  <Text style={styles.reasonValue}>{connectSnapshot.requirementsDisabledReason}</Text>
                </View>
              ) : null}
              {connectSnapshot.requirementsDue.length > 0 ? (
                <View style={styles.requirementGroup}>
                  <Text style={styles.requirementLabel}>Pendencias para concluir</Text>
                  <View style={styles.requirementWrap}>
                    {connectSnapshot.requirementsDue.map((item) => (
                      <View key={`due-${item}`} style={styles.requirementChip}>
                        <Text style={styles.requirementChipText}>{formatStripeRequirementLabel(item)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}
              {connectSnapshot.requirementsPending.length > 0 ? (
                <View style={styles.requirementGroup}>
                  <Text style={styles.requirementLabel}>Em revisao pela Stripe</Text>
                  <View style={styles.requirementWrap}>
                    {connectSnapshot.requirementsPending.map((item) => (
                      <View key={`pending-${item}`} style={styles.requirementChipMuted}>
                        <Text style={styles.requirementChipMutedText}>
                          {formatStripeRequirementLabel(item)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}
              <View style={styles.connectActions}>
                <GhostButton
                  disabled={createConnectOnboarding.isPending}
                  icon="account-balance"
                  label={
                    createConnectOnboarding.isPending
                      ? 'Abrindo Stripe'
                      : connectSnapshot.status === 'not_started'
                        ? 'Configurar recebimento'
                        : connectSnapshot.status === 'ready'
                          ? 'Reabrir configuracao'
                          : 'Continuar onboarding'
                  }
                  onPress={() => void handleConnectOnboarding()}
                  tone="primary"
                />
                <GhostButton
                  disabled={syncConnectAccount.isPending}
                  icon="refresh"
                  label={syncConnectAccount.isPending ? 'Atualizando status' : 'Atualizar status'}
                  onPress={() => void handleSyncConnectAccount()}
                />
              </View>
            </ProfileSection>

            <NotificationPreferencesCard accountType="musician" />

            <GlassCard padding={spacing.xl} style={styles.actionsCard} surface="panel">
              <Text style={styles.actionsTitle}>Sua conta artistica esta pronta para operacao.</Text>
              <Text style={styles.actionsCopy}>
                Revise cache, estilos, repertorio e portfolio visual antes de salvar o perfil.
              </Text>
              <MetaLine
                label="Criado em"
                value={
                  account?.created_at
                    ? new Date(account.created_at).toLocaleDateString('pt-BR')
                    : 'Agora'
                }
              />
              <GhostButton label="Sair da conta" onPress={() => void handleSignOut()} />
            </GlassCard>
          </View>
        </ScrollView>

        <View style={[styles.stickyActionWrap, { bottom: stickyActionBottom }]}>
          {(errorMessage || feedback) && (
            <GlassCard padding={spacing.lg} style={styles.feedbackCard} surface="panel">
              {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
              {feedback ? <Text style={styles.feedbackText}>{feedback}</Text> : null}
            </GlassCard>
          )}

          <GlowButton
            containerStyle={styles.primaryAction}
            disabled={saveProfile.isPending || isMutatingMedia}
            icon="save"
            label={saveProfile.isPending ? 'Salvando perfil' : 'Salvar perfil do Musico'}
            onPress={() => void handleSave()}
          />
        </View>

        <BottomNav accountType="musician" active="profile" />
      </View>
    </SafeAreaView>
  );
}

function MediaCard({
  asset,
  disabled,
  index,
  onRemove,
}: {
  asset: ProfileMediaAsset;
  disabled: boolean;
  index: number;
  onRemove: () => void;
}) {
  return (
    <View style={styles.mediaCard}>
      <View style={styles.mediaPreview}>
        <ImageUri source={asset.publicUrl} style={styles.mediaImage} />
        <Pressable
          disabled={disabled}
          onPress={onRemove}
          style={({ pressed }) => [
            styles.mediaDeleteButton,
            pressed && styles.selectableChipPressed,
            disabled && styles.mediaDeleteButtonDisabled,
          ]}>
          <MaterialIcons color={colors.onSurface} name="close" size={16} />
        </Pressable>
      </View>
      <Text style={styles.mediaLabel}>{index === 0 ? 'Destaque do perfil' : `Foto ${index + 1}`}</Text>
    </View>
  );
}

function ProfileSection({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <GlassCard padding={spacing.xl} style={styles.sectionCard} surface="panel">
      <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </GlassCard>
  );
}

function MetricPill({
  icon,
  label,
  tone,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  tone: 'primary' | 'secondary';
}) {
  return (
    <View
      style={[
        styles.metricPill,
        tone === 'primary' ? styles.metricPillPrimary : styles.metricPillSecondary,
      ]}>
      <MaterialIcons
        color={tone === 'primary' ? colors.primary : colors.secondary}
        name={icon}
        size={18}
      />
      <Text style={styles.metricPillText}>{label}</Text>
    </View>
  );
}

function SelectableChip({
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
        styles.selectableChip,
        active && styles.selectableChipActive,
        pressed && styles.selectableChipPressed,
      ]}>
      <Text style={[styles.selectableChipText, active && styles.selectableChipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function MetaLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaLine}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function MusicianProfileLoadingState({ stickyActionBottom }: { stickyActionBottom: number }) {
  return (
    <SafeAreaView edges={['left', 'right']} style={styles.screen}>
      <View style={styles.body}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: stickyActionBottom + 140 }]}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}>
          <View style={[styles.hero, styles.heroLoading]}>
            <View style={styles.heroLoadingInner}>
              <View style={styles.heroTop}>
                <LoadingBlock style={styles.loadingBrandBadge} />
                <LoadingBlock style={styles.loadingStatusBadge} />
              </View>

              <View style={styles.heroBottom}>
                <View style={styles.badges}>
                  <LoadingBlock style={styles.loadingChipWide} />
                  <LoadingBlock style={styles.loadingChipMedium} />
                </View>

                <LoadingBlock style={styles.loadingHeroTitle} />

                <View style={styles.metrics}>
                  <LoadingBlock style={styles.loadingMetricBlock} />
                  <LoadingBlock style={styles.loadingMetricBlock} />
                </View>

                <LoadingBlock style={styles.loadingMetaLine} />
              </View>
            </View>
          </View>

          <View style={styles.sections}>
            <ProfileLoadingSection />
            <ProfileLoadingSection />
            <ProfileLoadingSection compact />
          </View>
        </ScrollView>

        <View style={[styles.stickyActionWrap, { bottom: stickyActionBottom }]}>
          <GlassCard padding={spacing.lg} style={styles.loadingActionCard} surface="panel">
            <LoadingBlock style={styles.loadingActionBlock} />
          </GlassCard>
        </View>

        <BottomNav accountType="musician" active="profile" />
      </View>
    </SafeAreaView>
  );
}

function ProfileLoadingSection({ compact = false }: { compact?: boolean }) {
  return (
    <GlassCard padding={spacing.xl} style={styles.sectionCard} surface="panel">
      <LoadingBlock style={styles.loadingEyebrow} />
      <LoadingBlock style={compact ? styles.loadingSectionTitleCompact : styles.loadingSectionTitle} />
      <View style={styles.sectionContent}>
        <LoadingBlock style={styles.loadingInput} />
        <LoadingBlock style={styles.loadingInput} />
        {!compact ? <LoadingBlock style={styles.loadingInputTall} /> : null}
      </View>
    </GlassCard>
  );
}

function LoadingBlock({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.loadingBlock, style]} />;
}

function toggleNumericValue(items: number[], value: number) {
  return items.includes(value) ? items.filter((item) => item !== value) : [...items, value];
}

function getNextSortOrder(items: ProfileMediaAsset[]) {
  if (items.length === 0) {
    return 0;
  }

  return Math.max(...items.map((item) => item.sortOrder)) + 1;
}

function onlyDigits(value: string) {
  return value.replace(/\D+/g, '');
}

function extractPostalCodeDigits(value: string) {
  return onlyDigits(value).slice(0, 8);
}

function formatPostalCodeInput(value: string) {
  const digits = extractPostalCodeDigits(value);

  if (digits.length <= 5) {
    return digits;
  }

  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function normalizeCurrencyInput(value: string) {
  return value.replace(/[^\d,]/g, '');
}

function parseInteger(value: string) {
  const normalized = onlyDigits(value);
  return normalized ? Number(normalized) : null;
}

function parseCurrencyToCents(value: string) {
  const normalized = value.trim().replace(/\./g, '').replace(',', '.');

  if (!normalized) {
    return null;
  }

  const amount = Number(normalized);

  if (!Number.isFinite(amount) || amount < 0) {
    return null;
  }

  return Math.round(amount * 100);
}

function formatCurrencyInput(value: number | null) {
  if (value === null) {
    return '';
  }

  const formatted = (value / 100).toFixed(2).replace('.', ',');
  return formatted.endsWith(',00') ? formatted.slice(0, -3) : formatted;
}

function updateForm<K extends keyof MusicianProfileFormState>(
  setForm: Dispatch<SetStateAction<MusicianProfileFormState>>,
  key: K,
  value: MusicianProfileFormState[K],
) {
  setForm((current) => ({
    ...current,
    [key]: value,
  }));
}

function handlePostalCodeChange(
  setForm: Dispatch<SetStateAction<MusicianProfileFormState>>,
  value: string,
) {
  const formattedPostalCode = formatPostalCodeInput(value);

  setForm((current) => {
    const currentPostalCode = extractPostalCodeDigits(current.postalCode);
    const nextPostalCode = extractPostalCodeDigits(formattedPostalCode);
    const shouldResetLocation = currentPostalCode !== nextPostalCode;

    return {
      ...current,
      city: shouldResetLocation ? '' : current.city,
      postalCode: formattedPostalCode,
      state: shouldResetLocation ? '' : current.state,
    };
  });
}

function isMusicianProfileComplete(form: MusicianProfileFormState) {
  return Boolean(
    form.stageName.trim() &&
      form.artistCategory.trim() &&
      extractPostalCodeDigits(form.postalCode).length === 8 &&
      form.city.trim() &&
      form.state.trim() &&
      parseCurrencyToCents(form.baseCache) !== null &&
      form.selectedGenreIds.length > 0,
  );
}

function getStripeConnectTone(status: StripeConnectedAccountStatus) {
  switch (status) {
    case 'ready':
      return 'primary' as const;
    case 'pending_review':
      return 'secondary' as const;
    case 'restricted':
      return 'danger' as const;
    case 'onboarding_required':
    case 'not_started':
    default:
      return 'neutral' as const;
  }
}

function formatStripeCapabilityLabel(value: string | null, fallback: string) {
  switch (value) {
    case 'active':
      return 'Ativo';
    case 'pending':
      return 'Pendente';
    case 'inactive':
      return 'Inativo';
    case 'restricted':
      return 'Restrito';
    default:
      return fallback;
  }
}

function formatConnectedAccountReference(accountId: string) {
  return accountId.length > 12 ? `${accountId.slice(0, 8)}...${accountId.slice(-4)}` : accountId;
}

function formatStripeRequirementLabel(value: string) {
  return value
    .replace(/^recipient\./, '')
    .replace(/^company\./, '')
    .replace(/^individual\./, '')
    .replace(/^documents\./, '')
    .replace(/\./g, ' / ')
    .replace(/_/g, ' ');
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
    paddingBottom: 148,
  },
  hero: {
    height: 520,
    overflow: 'hidden',
  },
  heroLoading: {
    backgroundColor: colors.surfaceContainerLowest,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    height: undefined,
    width: undefined,
  },
  heroLoadingInner: {
    flex: 1,
  },
  heroTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: spacing.lg,
    position: 'absolute',
    right: spacing.lg,
    top: spacing.xl,
  },
  brand: {
    ...typography.label,
    color: colors.primary,
  },
  liveBadge: {
    alignItems: 'center',
    backgroundColor: colors.errorContainer,
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  liveDot: {
    backgroundColor: colors.error,
    borderRadius: radii.pill,
    height: 6,
    width: 6,
  },
  liveLabel: {
    ...typography.label,
    color: '#ffb2b9',
  },
  heroBottom: {
    bottom: spacing.xl,
    gap: spacing.md,
    left: spacing.lg,
    position: 'absolute',
    right: spacing.lg,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  genreBadge: {
    backgroundColor: 'rgba(37,37,49,0.80)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  genreLabel: {
    ...typography.label,
    color: colors.primary,
  },
  secondaryBadge: {
    backgroundColor: 'rgba(0,238,252,0.14)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  secondaryBadgeLabel: {
    ...typography.label,
    color: colors.secondary,
  },
  name: {
    ...typography.display,
    color: colors.onSurface,
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricPill: {
    alignItems: 'center',
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  metricPillPrimary: {
    backgroundColor: 'rgba(243,255,202,0.10)',
  },
  metricPillSecondary: {
    backgroundColor: 'rgba(0,238,252,0.10)',
  },
  metricPillText: {
    ...typography.bodyMedium,
    color: colors.onSurface,
  },
  heroMeta: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
  },
  loadingBlock: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: radii.pill,
    borderWidth: 1,
    overflow: 'hidden',
  },
  loadingBrandBadge: {
    height: 18,
    width: 76,
  },
  loadingStatusBadge: {
    height: 30,
    width: 136,
  },
  loadingChipWide: {
    height: 30,
    width: 144,
  },
  loadingChipMedium: {
    height: 30,
    width: 112,
  },
  loadingHeroTitle: {
    height: 40,
    width: '72%',
  },
  loadingMetricBlock: {
    height: 42,
    minWidth: 138,
  },
  loadingMetaLine: {
    height: 18,
    width: 184,
  },
  loadingEyebrow: {
    height: 16,
    width: 112,
  },
  loadingSectionTitle: {
    height: 34,
    width: '82%',
  },
  loadingSectionTitleCompact: {
    height: 34,
    width: '68%',
  },
  loadingInput: {
    height: 60,
    width: '100%',
  },
  loadingInputTall: {
    height: 136,
    width: '100%',
  },
  loadingActionCard: {
    gap: spacing.sm,
  },
  loadingActionBlock: {
    height: 58,
    width: '100%',
  },
  sections: {
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
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
  sectionContent: {
    gap: spacing.md,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  selectableChip: {
    backgroundColor: colors.surfaceContainerHigh,
    borderColor: colors.borderGhost,
    borderRadius: radii.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: spacing.md,
  },
  selectableChipActive: {
    backgroundColor: 'rgba(243,255,202,0.14)',
    borderColor: 'rgba(243,255,202,0.24)',
  },
  selectableChipPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  selectableChipText: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
  },
  selectableChipTextActive: {
    color: colors.primary,
  },
  helperText: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
  },
  connectStatusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  connectActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  requirementGroup: {
    gap: spacing.sm,
  },
  requirementLabel: {
    ...typography.label,
    color: colors.onSurfaceVariant,
  },
  requirementWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  requirementChip: {
    backgroundColor: 'rgba(167,1,56,0.18)',
    borderColor: 'rgba(255,178,185,0.22)',
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  requirementChipText: {
    ...typography.label,
    color: '#ffb2b9',
  },
  requirementChipMuted: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  requirementChipMutedText: {
    ...typography.label,
    color: colors.onSurfaceVariant,
  },
  mediaHeader: {
    gap: spacing.md,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  mediaCard: {
    gap: spacing.sm,
    width: '48%',
  },
  mediaPreview: {
    aspectRatio: 1,
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.borderGhost,
    borderRadius: radii.md,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  mediaImage: {
    height: '100%',
    width: '100%',
  },
  mediaDeleteButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(13,13,22,0.76)',
    borderRadius: radii.pill,
    height: 28,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.sm,
    top: spacing.sm,
    width: 28,
  },
  mediaDeleteButtonDisabled: {
    opacity: 0.5,
  },
  mediaLabel: {
    ...typography.label,
    color: colors.onSurfaceVariant,
  },
  mediaEmptyState: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.borderGhost,
    borderRadius: radii.md,
    borderStyle: 'dashed',
    borderWidth: 1,
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  mediaEmptyTitle: {
    ...typography.bodyBold,
    color: colors.onSurface,
    textAlign: 'center',
  },
  mediaEmptyCopy: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  flexInput: {
    flex: 1,
  },
  stateInput: {
    width: 88,
  },
  feedbackCard: {
    gap: spacing.sm,
  },
  errorText: {
    ...typography.bodyMedium,
    color: '#ffb2b9',
  },
  feedbackText: {
    ...typography.bodyMedium,
    color: colors.secondary,
  },
  actionsCard: {
    gap: spacing.md,
  },
  actionsTitle: {
    ...typography.sectionTitle,
    color: colors.onSurface,
  },
  actionsCopy: {
    ...typography.body,
    color: colors.onSurfaceVariant,
  },
  reasonCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.borderGhost,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  reasonLabel: {
    ...typography.label,
    color: colors.secondary,
  },
  reasonValue: {
    ...typography.bodyMedium,
    color: colors.onSurface,
  },
  metaLine: {
    gap: 4,
  },
  metaLabel: {
    ...typography.label,
    color: colors.onSurfaceVariant,
  },
  metaValue: {
    ...typography.bodyBold,
    color: colors.onSurface,
  },
  primaryAction: {
    width: '100%',
  },
  stickyActionWrap: {
    gap: spacing.sm,
    left: spacing.lg,
    position: 'absolute',
    right: spacing.lg,
  },
});
