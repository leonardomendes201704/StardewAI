import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthSession } from '@/src/features/auth/auth-provider';
import {
  BAR_MEDIA_LIMIT,
  useDeleteVenueMedia,
  useUploadVenueMedia,
  type ProfileMediaAsset,
} from '@/src/features/profiles/profile-media';
import {
  usePostalCodeLookup,
  useSaveVenueProfile,
  useVenueProfileEditor,
} from '@/src/features/profiles/profile-editor';
import { NotificationPreferencesCard } from '@/src/features/notifications/notification-preferences-card';
import {
  buildBarTrustSignals,
  ProfileReputationCard,
  ProfileTrustSignalsCard,
  useVenueProfileReputation,
} from '@/src/features/reputation/profile-reputation';
import {
  Avatar,
  BottomNav,
  GhostButton,
  GlassCard,
  GlowButton,
  ImageUri,
  InputField,
  TopBar,
} from '@/src/shared/components';
import { colors, radii, spacing, typography } from '@/src/shared/theme';

const PERFORMANCE_DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'] as const;
const VENUE_TYPES = ['Bar', 'Pub', 'Restaurante', 'Hotel', 'Evento'] as const;

type BarProfileFormState = {
  addressComplement: string;
  addressNumber: string;
  bio: string;
  capacity: string;
  city: string;
  neighborhood: string;
  performanceDays: string[];
  postalCode: string;
  state: string;
  street: string;
  venueName: string;
  venueType: string;
};

const EMPTY_FORM: BarProfileFormState = {
  addressComplement: '',
  addressNumber: '',
  bio: '',
  capacity: '',
  city: '',
  neighborhood: '',
  performanceDays: [],
  postalCode: '',
  state: '',
  street: '',
  venueName: '',
  venueType: '',
};

export default function BarProfileScreen() {
  const router = useRouter();
  const { signOut, user } = useAuthSession();
  const profileQuery = useVenueProfileEditor();
  const reputationQuery = useVenueProfileReputation();
  const saveProfile = useSaveVenueProfile();
  const uploadVenueMedia = useUploadVenueMedia();
  const deleteVenueMedia = useDeleteVenueMedia();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [form, setForm] = useState<BarProfileFormState>(EMPTY_FORM);
  const postalCodeLookup = usePostalCodeLookup(form.postalCode);

  useEffect(() => {
    if (!profileQuery.data) {
      return;
    }

    const { venueProfile } = profileQuery.data;
    setForm({
      addressComplement: venueProfile?.address_complement ?? '',
      addressNumber: venueProfile?.address_number ?? '',
      bio: venueProfile?.bio ?? '',
      capacity: venueProfile?.capacity !== null && venueProfile?.capacity !== undefined ? String(venueProfile.capacity) : '',
      city: venueProfile?.city ?? '',
      neighborhood: venueProfile?.neighborhood ?? '',
      performanceDays: venueProfile?.performance_days ?? [],
      postalCode: formatPostalCodeInput(venueProfile?.postal_code ?? ''),
      state: venueProfile?.state ?? '',
      street: venueProfile?.street ?? '',
      venueName: venueProfile?.venue_name ?? '',
      venueType: venueProfile?.venue_type ?? '',
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

      if (
        current.city === postalCodeLookup.data.city &&
        current.state === postalCodeLookup.data.state &&
        current.street === postalCodeLookup.data.street &&
        current.neighborhood === postalCodeLookup.data.neighborhood
      ) {
        return current;
      }

      return {
        ...current,
        city: postalCodeLookup.data.city,
        neighborhood: postalCodeLookup.data.neighborhood,
        state: postalCodeLookup.data.state,
        street: postalCodeLookup.data.street,
      };
    });
  }, [postalCodeLookup.data]);

  async function handleSave() {
    setErrorMessage(null);
    setFeedback(null);
    const postalCodeDigits = extractPostalCodeDigits(form.postalCode);

    if (postalCodeDigits.length > 0 && postalCodeDigits.length < 8) {
      setErrorMessage('Informe um CEP valido com 8 digitos para preencher o endereco.');
      return;
    }

    if (postalCodeDigits.length !== 8) {
      setErrorMessage('Informe o CEP do estabelecimento antes de salvar o perfil.');
      return;
    }

    if (postalCodeLookup.isFetching) {
      setErrorMessage('Aguarde a consulta do CEP terminar antes de salvar.');
      return;
    }

    if (postalCodeLookup.isError) {
      setErrorMessage(postalCodeLookup.error.message);
      return;
    }

    if (!form.street.trim() || !form.city.trim() || !form.state.trim()) {
      setErrorMessage('Nao foi possivel preencher logradouro, cidade e UF a partir deste CEP.');
      return;
    }

    if (!form.addressNumber.trim()) {
      setErrorMessage('Informe o numero do endereco para concluir o perfil do Bar.');
      return;
    }

    try {
      await saveProfile.mutateAsync({
        addressComplement: form.addressComplement,
        addressNumber: form.addressNumber,
        bio: form.bio,
        capacity: parseInteger(form.capacity),
        city: form.city,
        neighborhood: form.neighborhood,
        performanceDays: form.performanceDays,
        postalCode: form.postalCode,
        state: form.state,
        street: form.street,
        venueName: form.venueName,
        venueType: form.venueType,
      });

      setFeedback(
        isBarProfileComplete(form)
          ? 'Perfil do Bar salvo e marcado como completo.'
          : 'Perfil salvo como rascunho. Falta completar nome, tipo de casa, CEP e numero do endereco.',
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Nao foi possivel salvar o perfil.');
    }
  }

  async function handleAddMedia() {
    setErrorMessage(null);
    setFeedback(null);

    try {
      const uploadedCount = await uploadVenueMedia.mutateAsync({
        nextSortOrder: getNextSortOrder(mediaAssets),
        selectionLimit: BAR_MEDIA_LIMIT - mediaAssets.length,
      });

      if (uploadedCount > 0) {
        setFeedback(
          uploadedCount === 1
            ? '1 foto do ambiente foi adicionada ao perfil.'
            : `${uploadedCount} fotos do ambiente foram adicionadas ao perfil.`,
        );
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Nao foi possivel enviar as fotos do ambiente.',
      );
    }
  }

  async function handleRemoveMedia(asset: ProfileMediaAsset) {
    setErrorMessage(null);
    setFeedback(null);

    try {
      await deleteVenueMedia.mutateAsync({
        assetId: asset.id,
        storagePath: asset.storagePath,
      });
      setFeedback('Foto removida do perfil do Bar.');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Nao foi possivel remover a foto do perfil.',
      );
    }
  }

  async function handleSignOut() {
    await signOut();
    router.replace('/');
  }

  if (profileQuery.isLoading && !profileQuery.data) {
    return <BarProfileLoadingState />;
  }

  const account = profileQuery.data?.account;
  const isSavingProfile = saveProfile.isPending;
  const isMutatingMedia = uploadVenueMedia.isPending || deleteVenueMedia.isPending;
  const isBusy = isSavingProfile || isMutatingMedia;
  const postalCodeDigits = extractPostalCodeDigits(form.postalCode);
  const profileCompleted = account?.profile_completed ?? false;
  const trustSignals = buildBarTrustSignals({
    city: form.city,
    completedContracts: reputationQuery.data?.completedContracts ?? 0,
    mediaCount: mediaAssets.length,
    postalCode: form.postalCode,
    profileCompleted: profileCompleted || isBarProfileComplete(form),
    state: form.state,
    street: form.street,
    totalReviews: reputationQuery.data?.totalReviews ?? 0,
  });

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.screen}>
      <TopBar centeredBrand location="Perfil do Bar" title="TocaAI" />

      <View style={styles.body}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <GlassCard padding={spacing.xl} style={styles.heroCard}>
            <Avatar icon="storefront" size={76} />
            <View style={styles.heroCopy}>
              <Text style={styles.eyebrow}>Conta do estabelecimento</Text>
              <Text style={styles.title}>{form.venueName.trim() || 'Seu palco comeca aqui.'}</Text>
              <Text style={styles.subtitle}>
                Preencha os dados operacionais da casa para liberar busca, agenda e publicacao de vagas.
              </Text>
            </View>

            <View style={styles.statusRow}>
              <StatusBadge
                label={profileCompleted ? 'Perfil completo' : 'Perfil em rascunho'}
                tone={profileCompleted ? 'primary' : 'secondary'}
              />
              <StatusBadge
                label={
                  mediaAssets.length > 0
                    ? `${mediaAssets.length}/${BAR_MEDIA_LIMIT} fotos do ambiente`
                    : form.performanceDays.length > 0
                      ? `${form.performanceDays.length} dias ativos`
                      : 'Sem agenda fixa'
                }
                tone="muted"
              />
            </View>

            <View style={styles.metaGrid}>
              <MetaBlock label="Email autenticado" value={user?.email ?? account?.email ?? 'Sessao ativa'} />
              <MetaBlock
                label="Criado em"
                value={
                  account?.created_at
                    ? new Date(account.created_at).toLocaleDateString('pt-BR')
                    : 'Agora'
                }
              />
            </View>
          </GlassCard>

          <ProfileTrustSignalsCard
            eyebrow="Confianca do perfil"
            signals={trustSignals}
            title="Selos basicos que ajudam o Musico a entender maturidade, consistencia e evidencias da casa."
          />

          <ProfileReputationCard
            emptyCopy="As avaliacoes aparecem aqui assim que os primeiros shows forem concluidos e avaliados pelos musicos."
            errorMessage={reputationQuery.isError ? reputationQuery.error.message : null}
            eyebrow="Historico de reputacao"
            loading={reputationQuery.isLoading}
            summary={reputationQuery.data}
            title="Como os musicos avaliaram a experiencia de tocar nesta casa."
          />

          <ProfileSection
            eyebrow="Identidade da casa"
            title="Como o contratante aparece para os musicos.">
            <InputField
              icon="storefront"
              onChangeText={(value) => updateForm(setForm, 'venueName', value)}
              placeholder="Nome do estabelecimento"
              value={form.venueName}
            />
            <View style={styles.chipWrap}>
              {VENUE_TYPES.map((venueType) => (
                <SelectableChip
                  active={form.venueType === venueType}
                  key={venueType}
                  label={venueType}
                  onPress={() => updateForm(setForm, 'venueType', venueType)}
                />
              ))}
            </View>
            <InputField
              icon="nightlife"
              onChangeText={(value) => updateForm(setForm, 'venueType', value)}
              placeholder="Tipo de casa"
              value={form.venueType}
            />
          </ProfileSection>

          <ProfileSection
            eyebrow="Local e contexto"
            title="CEP obrigatorio com endereco resolvido automaticamente pelo ViaCEP.">
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
            <InputField
              icon="pin-drop"
              editable={false}
              placeholder="Bairro preenchido automaticamente"
              value={form.neighborhood}
            />
            <InputField
              icon="home-work"
              editable={false}
              placeholder="Logradouro preenchido automaticamente"
              value={form.street}
            />
            {postalCodeDigits.length === 8 && postalCodeLookup.isFetching ? (
              <Text style={styles.helperText}>Consultando CEP no ViaCEP...</Text>
            ) : null}
            {postalCodeDigits.length === 8 && postalCodeLookup.isError ? (
              <Text style={styles.errorText}>{postalCodeLookup.error.message}</Text>
            ) : null}
            {postalCodeDigits.length === 8 &&
            !postalCodeLookup.isFetching &&
            !postalCodeLookup.isError &&
            form.street.trim() &&
            form.city.trim() &&
            form.state.trim() ? (
              <Text style={styles.helperText}>
                Logradouro, bairro, cidade e UF foram preenchidos automaticamente pelo CEP e ficam bloqueados para edicao.
              </Text>
            ) : null}
            <View style={styles.row}>
              <InputField
                containerStyle={styles.numberInput}
                icon="tag"
                onChangeText={(value) => updateForm(setForm, 'addressNumber', value)}
                placeholder="Numero"
                value={form.addressNumber}
              />
              <InputField
                containerStyle={styles.flexInput}
                icon="edit-location-alt"
                onChangeText={(value) => updateForm(setForm, 'addressComplement', value)}
                placeholder="Complemento"
                value={form.addressComplement}
              />
            </View>
          </ProfileSection>

          <ProfileSection
            eyebrow="Operacao da casa"
            title="Capacidade e dias em que costuma haver musica ao vivo.">
            <InputField
              icon="groups"
              keyboardType="number-pad"
              onChangeText={(value) => updateForm(setForm, 'capacity', onlyDigits(value))}
              placeholder="Capacidade estimada"
              value={form.capacity}
            />
            <View style={styles.chipWrap}>
              {PERFORMANCE_DAYS.map((day) => (
                <SelectableChip
                  active={form.performanceDays.includes(day)}
                  key={day}
                  label={day}
                  onPress={() =>
                    setForm((current) => ({
                      ...current,
                      performanceDays: toggleValue(current.performanceDays, day),
                    }))
                  }
                />
              ))}
            </View>
          </ProfileSection>

          <ProfileSection
            eyebrow="Clima e referencia visual"
            title="Texto curto da casa e fotos reais do ambiente para o perfil publico.">
            <InputField
              icon="notes"
              multiline
              numberOfLines={6}
              onChangeText={(value) => updateForm(setForm, 'bio', value)}
              placeholder="Descreva o ambiente, publico, estilos musicais e expectativas da casa."
              value={form.bio}
            />
            <View style={styles.mediaHeader}>
              <Text style={styles.helperText}>
                Adicione ate {BAR_MEDIA_LIMIT} fotos do ambiente. A primeira vira a capa usada pelo app.
              </Text>
              <GhostButton
                disabled={uploadVenueMedia.isPending || mediaAssets.length >= BAR_MEDIA_LIMIT}
                icon="add-photo-alternate"
                label={
                  uploadVenueMedia.isPending
                    ? 'Enviando fotos'
                    : mediaAssets.length >= BAR_MEDIA_LIMIT
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
                    disabled={deleteVenueMedia.isPending}
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
                  Envie imagens reais da fachada, do palco ou do ambiente para fortalecer o perfil do Bar.
                </Text>
              </View>
            )}
          </ProfileSection>

          <NotificationPreferencesCard accountType="bar" />

          {(errorMessage || feedback) && (
            <GlassCard padding={spacing.lg} style={styles.feedbackCard} surface="panel">
              {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
              {feedback ? <Text style={styles.feedbackText}>{feedback}</Text> : null}
            </GlassCard>
          )}

          <GlassCard padding={spacing.xl} style={styles.actionsCard} surface="panel">
            <Text style={styles.actionsTitle}>Salvar este perfil antes de publicar vagas.</Text>
            <Text style={styles.actionsCopy}>
              O app ja atualiza `display_name`, a capa visual do perfil e os flags de completude da conta quando os campos-chave estiverem preenchidos.
            </Text>
            <GlowButton
              containerStyle={styles.primaryAction}
              disabled={isBusy}
              icon="save"
              label={isSavingProfile ? 'Salvando perfil' : 'Salvar perfil do Bar'}
              onPress={() => void handleSave()}
            />
            <GhostButton label="Sair da conta" onPress={() => void handleSignOut()} />
          </GlassCard>
        </ScrollView>

        <BottomNav accountType="bar" active="profile" />
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
      <Text style={styles.mediaLabel}>{index === 0 ? 'Capa do perfil' : `Foto ${index + 1}`}</Text>
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

function MetaBlock({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaBlock}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: 'muted' | 'primary' | 'secondary';
}) {
  const badgeStyle =
    tone === 'primary'
      ? styles.badgePrimary
      : tone === 'secondary'
        ? styles.badgeSecondary
        : styles.badgeMuted;
  const textStyle =
    tone === 'primary'
      ? styles.badgeTextPrimary
      : tone === 'secondary'
        ? styles.badgeTextSecondary
        : styles.badgeTextMuted;

  return (
    <View style={[styles.badge, badgeStyle]}>
      <Text style={[styles.badgeText, textStyle]}>{label}</Text>
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

function BarProfileLoadingState() {
  return (
    <SafeAreaView edges={['left', 'right']} style={styles.screen}>
      <TopBar location="Perfil do Bar" title="Perfil do Bar" />

      <View style={styles.body}>
        <ScrollView contentContainerStyle={styles.content} scrollEnabled={false} showsVerticalScrollIndicator={false}>
          <GlassCard padding={spacing.xl} style={styles.heroCard}>
            <LoadingBlock style={styles.loadingAvatar} />

            <View style={styles.heroCopy}>
              <LoadingBlock style={styles.loadingEyebrow} />
              <LoadingBlock style={styles.loadingTitle} />
              <LoadingBlock style={styles.loadingSubtitle} />
            </View>

            <View style={styles.statusRow}>
              <LoadingBlock style={styles.loadingBadgeWide} />
              <LoadingBlock style={styles.loadingBadgeMedium} />
            </View>

            <View style={styles.metaGrid}>
              <LoadingBlock style={styles.loadingMeta} />
              <LoadingBlock style={styles.loadingMeta} />
            </View>
          </GlassCard>

          <ProfileLoadingSection />
          <ProfileLoadingSection />
          <ProfileLoadingSection compact />

          <GlassCard padding={spacing.xl} style={styles.actionsCard} surface="panel">
            <LoadingBlock style={styles.loadingActionBlock} />
            <LoadingBlock style={styles.loadingSecondaryActionBlock} />
          </GlassCard>
        </ScrollView>

        <BottomNav accountType="bar" active="profile" />
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

function toggleValue(items: string[], value: string) {
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

function parseInteger(value: string) {
  const normalized = onlyDigits(value);
  return normalized ? Number(normalized) : null;
}

function updateForm<K extends keyof BarProfileFormState>(
  setForm: Dispatch<SetStateAction<BarProfileFormState>>,
  key: K,
  value: BarProfileFormState[K],
) {
  setForm((current) => ({
    ...current,
    [key]: value,
  }));
}

function handlePostalCodeChange(
  setForm: Dispatch<SetStateAction<BarProfileFormState>>,
  value: string,
) {
  const formattedPostalCode = formatPostalCodeInput(value);

  setForm((current) => {
    const currentPostalCode = extractPostalCodeDigits(current.postalCode);
    const nextPostalCode = extractPostalCodeDigits(formattedPostalCode);
    const shouldResetAddress = currentPostalCode !== nextPostalCode;

    return {
      ...current,
      city: shouldResetAddress ? '' : current.city,
      neighborhood: shouldResetAddress ? '' : current.neighborhood,
      postalCode: formattedPostalCode,
      state: shouldResetAddress ? '' : current.state,
      street: shouldResetAddress ? '' : current.street,
    };
  });
}

function isBarProfileComplete(form: BarProfileFormState) {
  return Boolean(
    form.venueName.trim() &&
      form.venueType.trim() &&
      extractPostalCodeDigits(form.postalCode).length === 8 &&
      form.street.trim() &&
      form.city.trim() &&
      form.state.trim() &&
      form.addressNumber.trim(),
  );
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
    paddingBottom: 148,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  heroCard: {
    gap: spacing.lg,
  },
  heroCopy: {
    gap: spacing.sm,
  },
  eyebrow: {
    ...typography.label,
    color: colors.secondary,
  },
  title: {
    ...typography.screenTitle,
    color: colors.primary,
  },
  subtitle: {
    ...typography.body,
    color: colors.onSurfaceVariant,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  badge: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  badgePrimary: {
    backgroundColor: colors.primary,
  },
  badgeSecondary: {
    backgroundColor: 'rgba(0,238,252,0.14)',
  },
  badgeMuted: {
    backgroundColor: 'rgba(37,37,49,0.82)',
  },
  badgeText: {
    ...typography.label,
  },
  badgeTextPrimary: {
    color: colors.onPrimaryFixed,
  },
  badgeTextSecondary: {
    color: colors.secondary,
  },
  badgeTextMuted: {
    color: colors.onSurfaceVariant,
  },
  loadingBlock: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: radii.pill,
    borderWidth: 1,
    overflow: 'hidden',
  },
  loadingAvatar: {
    borderRadius: radii.pill,
    height: 76,
    width: 76,
  },
  loadingEyebrow: {
    height: 16,
    width: 112,
  },
  loadingTitle: {
    height: 34,
    width: '72%',
  },
  loadingSubtitle: {
    height: 18,
    width: '92%',
  },
  loadingBadgeWide: {
    height: 30,
    width: 136,
  },
  loadingBadgeMedium: {
    height: 30,
    width: 112,
  },
  loadingMeta: {
    height: 18,
    width: '64%',
  },
  loadingSectionTitle: {
    height: 30,
    width: '78%',
  },
  loadingSectionTitleCompact: {
    height: 30,
    width: '64%',
  },
  loadingInput: {
    height: 60,
    width: '100%',
  },
  loadingInputTall: {
    height: 136,
    width: '100%',
  },
  loadingActionBlock: {
    height: 56,
    width: '100%',
  },
  loadingSecondaryActionBlock: {
    height: 44,
    width: '100%',
  },
  metaGrid: {
    gap: spacing.md,
  },
  metaBlock: {
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
    minHeight: 40,
    justifyContent: 'center',
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
  numberInput: {
    width: 124,
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
  primaryAction: {
    marginTop: spacing.xs,
  },
});
