import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  canContractBeCancelled,
  canContractBeCompleted,
  formatContractMutationDateLabel,
  formatContractReasonLabel,
  formatContractScheduleChangeLabel,
  formatContractScheduleChangePreviousLabel,
  formatContractStatusLabel,
  getContractTone,
  useCancelOpportunityContract,
  useCompleteOpportunityContract,
  useConfirmOpportunityContract,
  useContractScheduleChanges,
  useDeclineDirectOpportunityInvite,
  useRescheduleOpportunityContract,
} from '@/src/features/contracts/contracts';
import {
  CancelContractModal,
  RescheduleContractModal,
  type ContractRescheduleFormState,
} from '@/src/features/contracts/contract-operation-modals';
import {
  buildContractPaymentStatusCopy,
  formatContractPaymentOccurrenceDateLabel,
  formatContractPaymentStatusLabel,
  getContractPaymentTone,
  useAttemptReleaseMusicianPayout,
  useContractPaymentSnapshot,
} from '@/src/features/payments/payments';
import {
  formatOpportunityApplicationStatusLabel,
  formatOpportunityBudget,
  formatOpportunityScheduleLabel,
  formatRecurrenceDaysLabel,
  getOpportunityApplicationTone,
  isDirectInviteApplication,
  useApplyToOpportunity,
  useMusicianOpportunityDetail,
} from '@/src/features/opportunities/opportunities';
import { type ProfileMediaAsset } from '@/src/features/profiles/profile-media';
import {
  buildPublicBarTrustSignals,
  ProfileTrustSignalsCard,
} from '@/src/features/reputation/profile-reputation';
import {
  BottomNav,
  GhostButton,
  GlassCard,
  GlowButton,
  ImageUri,
  TopBar,
  getBottomNavStickyActionOffset,
} from '@/src/shared/components';
import { colors, radii, spacing, typography } from '@/src/shared/theme';

const defaultOpportunityImage =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCrt1x9MZ1YV-DOzUUTG9KuJgd7GOkSWSdo8aLxGeNdkKKBVX9agul9JOWv2lyEEBHZR_iqysSY0CCS4acK0sg1yRpUYrcZYrBbhAcbTY63lGvuzyG6oiYZf503WKqF4fVAIAaHXjR1zxps2keXJcWzAs3ZI7avUQOkhELUjUd29OPwFNObgoj4pMTMMVzR4J6eRH2Jxt3bd8CHLmiLsArY8rCjVX6rG_jCvdOwv6S42wNB0bv1FhPvEuAfVCVefpuxPDBodSKxpRxG';

export function OpportunityDetailScreen({ opportunityId }: { opportunityId?: string }) {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const stickyActionBottom = getBottomNavStickyActionOffset(insets.bottom);
  const detailQuery = useMusicianOpportunityDetail(opportunityId);
  const applyMutation = useApplyToOpportunity(opportunityId ?? '');
  const cancelContractMutation = useCancelOpportunityContract();
  const completeContractMutation = useCompleteOpportunityContract();
  const confirmContractMutation = useConfirmOpportunityContract();
  const declineInviteMutation = useDeclineDirectOpportunityInvite();
  const rescheduleMutation = useRescheduleOpportunityContract();
  const scheduleChangesQuery = useContractScheduleChanges(detailQuery.data?.contract?.id);
  const paymentQuery = useContractPaymentSnapshot(
    detailQuery.data?.contract?.id,
    detailQuery.data?.opportunity,
  );
  const releasePayoutMutation = useAttemptReleaseMusicianPayout();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isRescheduleModalVisible, setIsRescheduleModalVisible] = useState(false);
  const [rescheduleForm, setRescheduleForm] = useState<ContractRescheduleFormState>(
    buildRescheduleFormFromOpportunity(),
  );

  useEffect(() => {
    setRescheduleForm(buildRescheduleFormFromOpportunity(detailQuery.data?.opportunity));
  }, [
    detailQuery.data?.opportunity?.duration_hours,
    detailQuery.data?.opportunity?.event_date,
    detailQuery.data?.opportunity?.location_label,
    detailQuery.data?.opportunity?.start_time,
  ]);

  async function handleApply() {
    if (!opportunityId) {
      return;
    }

    setErrorMessage(null);
    setFeedback(null);

    try {
      await applyMutation.mutateAsync();
      setFeedback('Candidatura enviada. O Bar ja pode ver seu perfil e seu portfolio.');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Nao foi possivel enviar sua candidatura.',
      );
    }
  }

  async function handleConfirmContract(contractId: string) {
    setErrorMessage(null);
    setFeedback(null);

    try {
      await confirmContractMutation.mutateAsync(contractId);
      setFeedback(
        'Contratacao confirmada. Esta vaga saiu do fluxo aberto e agora entra na sua agenda.',
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Nao foi possivel confirmar a contratacao.',
      );
    }
  }

  async function handleCompleteContract(contractId: string) {
    setErrorMessage(null);
    setFeedback(null);

    try {
      await completeContractMutation.mutateAsync(contractId);
      setFeedback('Show marcado como concluido. O registro agora entra no historico da agenda.');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Nao foi possivel concluir esta contratacao.',
      );
    }
  }

  async function handleCancelContract(contractId: string) {
    setErrorMessage(null);
    setFeedback(null);

    try {
      await cancelContractMutation.mutateAsync({
        contractId,
        reason: cancelReason,
      });
      setIsCancelModalVisible(false);
      setCancelReason('');
      setFeedback('Contratacao cancelada. Ela deixa de bloquear sua agenda a partir de agora.');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Nao foi possivel cancelar esta contratacao.',
      );
    }
  }

  async function handleDeclineInvite(contractId: string) {
    setErrorMessage(null);
    setFeedback(null);

    try {
      await declineInviteMutation.mutateAsync(contractId);
      setFeedback('Convite recusado. Esta oportunidade deixa de bloquear sua agenda.');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Nao foi possivel recusar este convite.',
      );
    }
  }

  async function handleRescheduleContract(contractId: string) {
    setErrorMessage(null);
    setFeedback(null);

    try {
      await rescheduleMutation.mutateAsync({
        contractId,
        durationHours: rescheduleForm.durationHours,
        eventDate: rescheduleForm.eventDate,
        locationLabel: rescheduleForm.locationLabel,
        reason: rescheduleForm.reason,
        startTime: rescheduleForm.startTime,
      });
      setIsRescheduleModalVisible(false);
      setFeedback('Agenda remarcada. O novo horario ja aparece no detalhe e na agenda.');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Nao foi possivel remarcar esta contratacao.',
      );
    }
  }

  async function handleReleasePayout(contractId: string, occurrenceDate: string) {
    setErrorMessage(null);
    setFeedback(null);

    try {
      const payload = await releasePayoutMutation.mutateAsync({
        contractId,
        occurrenceDate,
      });

      setFeedback(
        payload.status === 'transferred'
          ? 'Repasse solicitado com sucesso. O status financeiro desta ocorrencia foi atualizado.'
          : 'O repasse ainda nao pode ser concluido. Revise o recebimento Stripe no seu perfil e tente novamente.',
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Nao foi possivel tentar liberar o repasse.',
      );
    }
  }

  if (!opportunityId) {
    return (
      <SafeAreaView edges={['left', 'right']} style={styles.screen}>
        <TopBar leftIcon="arrow-back" onLeftPress={() => router.back()} title="Detalhes da vaga" />
        <View style={styles.body}>
          <View style={styles.contentWrap}>
            <GlassCard padding={spacing.xl} surface="panel">
              <Text style={styles.sectionEyebrow}>Vaga indisponivel</Text>
              <Text style={styles.sectionTitle}>
                Nao foi possivel identificar qual vaga abrir.
              </Text>
              <Text style={styles.sectionCopy}>
                Volte para a home do Musico e abra a vaga novamente pelo card da oportunidade.
              </Text>
              <GhostButton
                label="Voltar para o feed"
                onPress={() => router.replace('/musician/home')}
              />
            </GlassCard>
          </View>
          <BottomNav accountType="musician" active="home" />
        </View>
      </SafeAreaView>
    );
  }

  if (detailQuery.isLoading && !detailQuery.data) {
    return <OpportunityDetailLoadingState stickyActionBottom={stickyActionBottom} />;
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <SafeAreaView edges={['left', 'right']} style={styles.screen}>
        <TopBar leftIcon="arrow-back" onLeftPress={() => router.back()} title="Detalhes da vaga" />
        <View style={styles.body}>
          <View style={styles.contentWrap}>
            <GlassCard padding={spacing.xl} surface="panel">
              <Text style={styles.sectionEyebrow}>Erro de carregamento</Text>
              <Text style={styles.sectionTitle}>Nao foi possivel abrir essa oportunidade.</Text>
              <Text style={styles.sectionCopy}>
                {detailQuery.error instanceof Error
                  ? detailQuery.error.message
                  : 'Tente voltar para o feed e abrir a vaga novamente.'}
              </Text>
              <GhostButton
                label="Voltar para o feed"
                onPress={() => router.replace('/musician/home')}
              />
            </GlassCard>
          </View>
          <BottomNav accountType="musician" active="home" />
        </View>
      </SafeAreaView>
    );
  }

  const {
    application,
    contract,
    opportunity,
    venueMediaAssets,
    venueProfile,
    venueRatingAverage,
    venueRatingCount,
    venueReviews,
  } = detailQuery.data;
  const canApply = opportunity.status === 'open' && !application;
  const hasContract = Boolean(contract);
  const isDirectInvite = isDirectInviteApplication(application?.source);
  const isPendingConfirmation = contract?.status === 'pending_confirmation';
  const canCancelContract = contract ? canContractBeCancelled(contract.status) : false;
  const canCompleteContract = contract ? canContractBeCompleted(contract.status) : false;
  const canRescheduleContract = contract ? canContractBeCancelled(contract.status) : false;
  const canDeclineDirectInvite = Boolean(
    contract &&
      contract.status === 'pending_confirmation' &&
      isDirectInvite &&
      application?.status === 'invited',
  );
  const cancellationReason = formatContractReasonLabel(contract?.cancellation_reason);
  const scheduleChanges = scheduleChangesQuery.data ?? [];
  const paymentSnapshot = paymentQuery.data ?? null;
  const stickyPaddingBottom = stickyActionBottom + 156;
  const galleryCardWidth = Math.max(screenWidth - spacing.lg * 2, 280);
  const addressSummary =
    venueProfile?.address_text?.trim() ||
    [venueProfile?.city, venueProfile?.state]
      .filter((value): value is string => Boolean(value))
      .join('/');
  const trustSignals = buildPublicBarTrustSignals({
    hasAddressContext: Boolean(addressSummary),
    hasOperationalProfile: Boolean(opportunity.venueName && (opportunity.venueType || addressSummary)),
    mediaCount: venueMediaAssets.length,
    totalReviews: venueRatingCount,
  });

  function handleGalleryScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const nextIndex = Math.round(
      event.nativeEvent.contentOffset.x / (galleryCardWidth + spacing.md),
    );
    setGalleryIndex(Math.max(0, Math.min(nextIndex, Math.max(venueMediaAssets.length - 1, 0))));
  }

  function handleViewerScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
    setViewerIndex(Math.max(0, Math.min(nextIndex, Math.max(venueMediaAssets.length - 1, 0))));
  }

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.screen}>
      <TopBar leftIcon="arrow-back" onLeftPress={() => router.back()} title="Detalhes da vaga" />

      <View style={styles.body}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: stickyPaddingBottom }]}
          showsVerticalScrollIndicator={false}>
          <GlassCard padding={0} style={styles.heroCard}>
            <View style={styles.heroImageWrap}>
              <ImageUri
                source={opportunity.venueCoverImageUrl ?? defaultOpportunityImage}
                style={styles.heroImage}
              />
              {opportunity.is_urgent ? (
                <View style={styles.urgentBadge}>
                  <View style={styles.urgentDot} />
                  <Text style={styles.urgentLabel}>Urgente</Text>
                </View>
              ) : null}
              <View style={styles.priceBadge}>
                <Text style={styles.priceBadgeText}>
                  {formatOpportunityBudget(opportunity.budget_cents)}
                </Text>
              </View>
            </View>

            <View style={styles.heroContent}>
              <Text style={styles.sectionEyebrow}>Marketplace musical</Text>
              <Text style={styles.heroTitle}>{opportunity.title}</Text>
              <Text style={styles.heroVenue}>
                {opportunity.venueName}
                {opportunity.venueType ? ` - ${opportunity.venueType}` : ''}
              </Text>
              <Text style={styles.heroMeta}>{formatOpportunityScheduleLabel(opportunity)}</Text>

              <View style={styles.chipRow}>
                {opportunity.music_genres.map((genre) => (
                  <MetaChip key={`${opportunity.id}-${genre}`} label={genre} />
                ))}
                {opportunity.artist_category ? (
                  <MetaChip label={opportunity.artist_category} tone="secondary" />
                ) : null}
                <MetaChip label={`${opportunity.city}/${opportunity.state}`} />
                {opportunity.recurrence_days.length > 0 ? (
                  <MetaChip
                    label={`Toda ${formatRecurrenceDaysLabel(opportunity.recurrence_days)}`}
                    tone="secondary"
                  />
                ) : null}
              </View>
            </View>
          </GlassCard>

          {venueMediaAssets.length > 0 ? (
            <DetailSection eyebrow="Fotos da casa">
              <ScrollView
                contentContainerStyle={styles.galleryRow}
                decelerationRate="fast"
                horizontal
                onMomentumScrollEnd={handleGalleryScroll}
                pagingEnabled={false}
                showsHorizontalScrollIndicator={false}
                snapToAlignment="start"
                snapToInterval={galleryCardWidth + spacing.md}>
                {venueMediaAssets.map((asset, index) => (
                  <Pressable
                    key={asset.id}
                    onPress={() => setViewerIndex(index)}
                    style={({ pressed }) => [
                      styles.galleryCard,
                      { width: galleryCardWidth },
                      pressed && styles.galleryCardPressed,
                    ]}>
                    <Image source={{ uri: asset.publicUrl }} style={styles.galleryImage} />
                    <View style={styles.galleryOverlay}>
                      <Text style={styles.galleryOverlayLabel}>
                        Foto {index + 1} de {venueMediaAssets.length}
                      </Text>
                      <MaterialIcons color={colors.onSurface} name="open-in-full" size={18} />
                    </View>
                  </Pressable>
                ))}
              </ScrollView>

              {venueMediaAssets.length > 1 ? (
                <View style={styles.galleryDots}>
                  {venueMediaAssets.map((asset, index) => (
                    <View
                      key={`${asset.id}-dot`}
                      style={[styles.galleryDot, index === galleryIndex && styles.galleryDotActive]}
                    />
                  ))}
                </View>
              ) : null}
            </DetailSection>
          ) : null}

          <DetailSection eyebrow="Agenda e local">
            <MetaLine
              icon="schedule"
              label="Agenda"
              value={formatOpportunityScheduleLabel(opportunity)}
            />
            <MetaLine
              icon="place"
              label="Referencia do local"
              value={opportunity.location_label}
            />
            <MetaLine
              icon="location-city"
              label="Cidade base"
              value={`${opportunity.city}/${opportunity.state}`}
            />
            {addressSummary ? (
              <MetaLine icon="home-work" label="Endereco da casa" value={addressSummary} />
            ) : null}
          </DetailSection>

          <DetailSection eyebrow="Estrutura e briefing">
            <View style={styles.copyBlock}>
              <Text style={styles.copyTitle}>Estrutura disponivel</Text>
              <Text style={styles.copyText}>
                {opportunity.structure_summary?.trim() ||
                  'O contratante ainda nao detalhou a estrutura deste evento.'}
              </Text>
            </View>
            <View style={styles.copyBlock}>
              <Text style={styles.copyTitle}>Observacoes do evento</Text>
              <Text style={styles.copyText}>
                {opportunity.notes?.trim() || 'Ainda nao ha observacoes extras para esta vaga.'}
              </Text>
            </View>
          </DetailSection>

          <DetailSection eyebrow="Casa contratante">
            <MetaLine icon="storefront" label="Estabelecimento" value={opportunity.venueName} />
            {opportunity.venueType ? (
              <MetaLine icon="festival" label="Tipo de casa" value={opportunity.venueType} />
            ) : null}
            {addressSummary ? (
              <MetaLine icon="map" label="Base operacional" value={addressSummary} />
            ) : null}
          </DetailSection>

          <ProfileTrustSignalsCard
            eyebrow="Sinais de confianca"
            signals={trustSignals}
            title="Sinais objetivos publicados pela casa."
          />

          {contract ? (
            <GlassCard padding={spacing.xl} style={styles.applicationCard} surface="panel">
              <Text style={styles.sectionEyebrow}>Contratacao</Text>
              <Text style={styles.sectionTitle}>{formatContractStatusLabel(contract.status)}</Text>
              <Text style={styles.sectionCopy}>
                {contract.status === 'pending_confirmation'
                  ? isDirectInvite
                    ? 'O Bar enviou um convite direto para esta vaga. Revise o contexto e escolha se quer aceitar este fechamento.'
                    : 'O Bar selecionou seu perfil para esta vaga. Revise o contexto e confirme para fechar o show.'
                  : contract.status === 'confirmed'
                    ? 'Voce confirmou esta contratacao. O evento agora fica fechado para novas candidaturas.'
                    : contract.status === 'completed'
                      ? 'Este show ja foi marcado como concluido no fluxo operacional.'
                      : application?.status === 'declined'
                        ? 'Voce recusou este convite e a vaga deixou de bloquear sua agenda.'
                        : application?.status === 'rejected' && isDirectInvite
                          ? 'Este convite foi encerrado pelo Bar antes da confirmacao final.'
                          : 'Esta contratacao foi cancelada e deixou de bloquear a vaga.'}
              </Text>
              <StatusPill
                label={formatContractStatusLabel(contract.status)}
                tone={getContractTone(contract.status)}
              />
              {isPendingConfirmation ? (
                <GlowButton
                  containerStyle={styles.inlinePrimaryAction}
                  disabled={confirmContractMutation.isPending}
                  icon="verified"
                  label={
                    confirmContractMutation.isPending
                      ? isDirectInvite
                        ? 'Aceitando convite'
                        : 'Confirmando contratacao'
                      : isDirectInvite
                        ? 'Aceitar convite'
                        : 'Confirmar contratacao'
                  }
                  onPress={() => void handleConfirmContract(contract.id)}
                />
              ) : null}
              {cancellationReason ? (
                <View style={styles.reasonCard}>
                  <Text style={styles.reasonLabel}>Motivo registrado</Text>
                  <Text style={styles.reasonValue}>{cancellationReason}</Text>
                </View>
              ) : null}
              {contract.last_rescheduled_at && contract.last_reschedule_reason ? (
                <View style={styles.reasonCard}>
                  <Text style={styles.reasonLabel}>Ultima remarcacao</Text>
                  <Text style={styles.reasonValue}>
                    {formatContractMutationDateLabel(
                      opportunity.event_date,
                      opportunity.start_time,
                    )}{' '}
                    por {contract.last_rescheduled_by === contract.artist_id ? 'Musico' : 'Bar'}
                  </Text>
                  <Text style={styles.reasonMeta}>
                    {formatContractReasonLabel(contract.last_reschedule_reason)}
                  </Text>
                </View>
              ) : null}
              {contract.status === 'completed' ? (
                <GhostButton
                  containerStyle={styles.inlinePrimaryAction}
                  icon="star-rate"
                  label="Avaliar Bar"
                  onPress={() => router.push(`/musician/reviews/${contract.id}`)}
                />
              ) : null}
              {canCompleteContract || canCancelContract || canRescheduleContract ? (
                <View style={styles.inlineActionsRow}>
                  {canCompleteContract ? (
                    <GhostButton
                      containerStyle={styles.inlineActionButton}
                      disabled={completeContractMutation.isPending}
                      icon="task-alt"
                      label={
                        completeContractMutation.isPending
                          ? 'Concluindo show'
                          : 'Marcar como concluido'
                      }
                      onPress={() => void handleCompleteContract(contract.id)}
                    />
                  ) : null}
                  {canRescheduleContract ? (
                    <GhostButton
                      containerStyle={styles.inlineActionButton}
                      disabled={rescheduleMutation.isPending}
                      icon="event-repeat"
                      label={
                        rescheduleMutation.isPending ? 'Salvando remarcacao' : 'Remarcar show'
                      }
                      onPress={() => {
                        setRescheduleForm(buildRescheduleFormFromOpportunity(opportunity));
                        setIsRescheduleModalVisible(true);
                      }}
                    />
                  ) : null}
                  {canDeclineDirectInvite ? (
                    <GhostButton
                      containerStyle={styles.inlineActionButton}
                      disabled={declineInviteMutation.isPending}
                      icon="block"
                      label={
                        declineInviteMutation.isPending ? 'Recusando convite' : 'Recusar convite'
                      }
                      onPress={() => void handleDeclineInvite(contract.id)}
                    />
                  ) : canCancelContract ? (
                    <GhostButton
                      containerStyle={styles.inlineActionButton}
                      disabled={cancelContractMutation.isPending}
                      icon="close"
                      label={
                        cancelContractMutation.isPending
                          ? 'Cancelando contratacao'
                          : 'Cancelar contratacao'
                      }
                      onPress={() => setIsCancelModalVisible(true)}
                    />
                  ) : null}
                </View>
              ) : null}
              {scheduleChanges.length > 0 ? (
                <View style={styles.historyList}>
                  <Text style={styles.historyTitle}>Historico de remarcacoes</Text>
                  {scheduleChanges.map((change) => (
                    <GlassCard
                      key={change.id}
                      padding={spacing.lg}
                      style={styles.historyCard}
                      surface="panel">
                      <Text style={styles.historyLead}>
                        {formatContractScheduleChangeLabel(change)}
                      </Text>
                      <Text style={styles.historyMeta}>
                        Antes: {formatContractScheduleChangePreviousLabel(change)}
                      </Text>
                      <Text style={styles.historyMeta}>
                        {change.changed_by === contract.artist_id ? 'Musico' : 'Bar'} atualizou em{' '}
                        {formatEventTimestamp(change.created_at)}
                      </Text>
                      <Text style={styles.historyReason}>{change.reason}</Text>
                    </GlassCard>
                  ))}
                </View>
              ) : null}
              <GhostButton
                icon="forum"
                label="Abrir conversa"
                onPress={() => router.push(`/chat/application/${contract.application_id}`)}
              />
            </GlassCard>
          ) : application ? (
            <GlassCard padding={spacing.xl} style={styles.applicationCard} surface="panel">
              <Text style={styles.sectionEyebrow}>Sua candidatura</Text>
              <Text style={styles.sectionTitle}>
                {formatOpportunityApplicationStatusLabel(application.status)}
              </Text>
              <Text style={styles.sectionCopy}>
                Enviada em {new Date(application.created_at).toLocaleString('pt-BR')}. O
                contratante ja pode abrir seu perfil, portfolio e cache.
              </Text>
              <StatusPill
                label={formatOpportunityApplicationStatusLabel(application.status)}
                tone={getOpportunityApplicationTone(application.status)}
              />
              <GhostButton
                icon="forum"
                label="Abrir conversa"
                onPress={() => router.push(`/chat/application/${application.id}`)}
              />
            </GlassCard>
          ) : null}

          {contract ? (
            <DetailSection
              eyebrow="Pagamento"
              title="Status financeiro publicado para esta ocorrencia.">
              {paymentQuery.isLoading && !paymentSnapshot ? (
                <>
                  <LoadingBlock style={styles.loadingMetaLine} />
                  <LoadingBlock style={styles.loadingMetaLine} />
                </>
              ) : paymentSnapshot ? (
                <>
                  <Text style={styles.sectionCopy}>
                    {buildContractPaymentStatusCopy(paymentSnapshot.status, 'musician')}
                  </Text>
                  <StatusPill
                    label={formatContractPaymentStatusLabel(paymentSnapshot.status)}
                    tone={getContractPaymentTone(paymentSnapshot.status)}
                  />
                  <MetaLine
                    icon="event"
                    label="Ocorrencia financeira"
                    value={formatContractPaymentOccurrenceDateLabel(paymentSnapshot.occurrenceDate)}
                  />
                  <MetaLine
                    icon="payments"
                    label="Valor bruto"
                    value={formatOpportunityBudget(paymentSnapshot.amountCents)}
                  />
                  {paymentSnapshot.musicianPayoutCents !== null ? (
                    <MetaLine
                      icon="payments"
                      label="Repasse previsto"
                      value={formatOpportunityBudget(paymentSnapshot.musicianPayoutCents)}
                    />
                  ) : null}
                  {paymentSnapshot.paidAt ? (
                    <MetaLine
                      icon="verified"
                      label="Pagamento confirmado em"
                      value={formatEventTimestamp(paymentSnapshot.paidAt)}
                    />
                  ) : null}
                  {paymentSnapshot.releaseAfter ? (
                    <MetaLine
                      icon="lock"
                      label="Retencao prevista ate"
                      value={formatEventTimestamp(paymentSnapshot.releaseAfter)}
                    />
                  ) : null}
                  {paymentSnapshot.failureMessage ? (
                    <View style={styles.reasonCard}>
                      <Text style={styles.reasonLabel}>Ultima falha registrada</Text>
                      <Text style={styles.reasonValue}>{paymentSnapshot.failureMessage}</Text>
                    </View>
                  ) : null}
                  {paymentSnapshot.status === 'funds_held' ||
                  paymentSnapshot.status === 'transfer_pending' ? (
                    <>
                      <GhostButton
                        containerStyle={styles.inlineActionButton}
                        disabled={releasePayoutMutation.isPending}
                        icon="payments"
                        label={
                          releasePayoutMutation.isPending
                            ? 'Tentando repasse'
                            : paymentSnapshot.status === 'funds_held'
                              ? 'Liberar repasse'
                              : 'Tentar liberar repasse'
                        }
                        onPress={() =>
                          void handleReleasePayout(contract.id, paymentSnapshot.occurrenceDate)
                        }
                        tone="primary"
                      />
                      <GhostButton
                        containerStyle={styles.inlineActionButton}
                        icon="account-balance"
                        label="Abrir recebimento Stripe"
                        onPress={() => router.push('/musician/profile')}
                        tone="primary"
                      />
                    </>
                  ) : null}
                  <GhostButton
                    containerStyle={styles.inlineActionButton}
                    disabled={paymentQuery.isFetching}
                    icon="refresh"
                    label={paymentQuery.isFetching ? 'Atualizando status' : 'Atualizar status'}
                    onPress={() => void paymentQuery.refetch()}
                  />
                </>
              ) : null}
            </DetailSection>
          ) : null}

          <DetailSection eyebrow="Reputacao da casa">
            {venueRatingCount > 0 ? (
              <>
                <GlassCard padding={spacing.lg} style={styles.reviewSummaryCard} surface="panel">
                  <View style={styles.reviewSummaryTop}>
                    <Text style={styles.reviewAverageValue}>
                      {formatReviewAverageValue(venueRatingAverage ?? 0)}
                    </Text>
                    <View style={styles.reviewSummaryCopy}>
                      <StarRating rating={venueRatingAverage ?? 0} size={18} />
                      <Text style={styles.reviewSummaryMeta}>
                        {formatReviewCountLabel(venueRatingCount)}
                      </Text>
                    </View>
                  </View>
                </GlassCard>

                <View style={styles.reviewList}>
                  {venueReviews.map((review) => (
                    <GlassCard
                      key={review.id}
                      padding={spacing.lg}
                      style={styles.reviewCard}
                      surface="panel">
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
              <Text style={styles.sectionCopy}>
                Este estabelecimento ainda nao possui avaliacoes publicas.
              </Text>
            )}
          </DetailSection>
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
            disabled={
              hasContract
                ? !isPendingConfirmation
                : !canApply || applyMutation.isPending
            }
            icon={
              contract
                ? contract.status === 'pending_confirmation'
                  ? 'verified'
                  : contract.status === 'confirmed'
                    ? 'event-available'
                    : contract.status === 'completed'
                      ? 'task-alt'
                      : 'block'
                : application
                  ? 'check-circle'
                  : opportunity.status === 'open'
                    ? 'campaign'
                    : 'lock'
            }
            label={
              contract
                ? contract.status === 'pending_confirmation'
                  ? confirmContractMutation.isPending
                    ? isDirectInvite
                      ? 'Aceitando convite'
                      : 'Confirmando contratacao'
                    : isDirectInvite
                      ? 'Aceitar convite'
                      : 'Confirmar contratacao'
                  : formatContractStatusLabel(contract.status)
                : application
                  ? formatOpportunityApplicationStatusLabel(application.status)
                  : applyMutation.isPending
                    ? 'Enviando candidatura'
                    : opportunity.status === 'open'
                      ? 'Candidatar-se a esta vaga'
                      : 'Vaga encerrada para candidatura'
            }
            onPress={() =>
              isPendingConfirmation && contract
                ? void handleConfirmContract(contract.id)
                : !contract
                  ? void handleApply()
                  : undefined
            }
          />
        </View>

        <BottomNav accountType="musician" active="home" />
      </View>

      <VenueGalleryViewer
        assets={venueMediaAssets}
        onClose={() => setViewerIndex(null)}
        onMomentumScrollEnd={handleViewerScroll}
        screenWidth={screenWidth}
        visible={viewerIndex !== null}
        viewerIndex={viewerIndex}
      />

      {contract ? (
        <>
          <CancelContractModal
            description="Explique o motivo para manter o historico claro para o Bar e para sua agenda."
            onClose={() => {
              setIsCancelModalVisible(false);
              setCancelReason('');
            }}
            onReasonChange={setCancelReason}
            onSubmit={() => void handleCancelContract(contract.id)}
            pending={cancelContractMutation.isPending}
            reason={cancelReason}
            submitLabel="Confirmar cancelamento"
            title="Cancelar esta contratacao"
            visible={isCancelModalVisible}
          />
          <RescheduleContractModal
            currentScheduleLabel={formatOpportunityScheduleLabel(opportunity)}
            description="Proponha a nova agenda e registre o motivo desta alteracao para os dois lados."
            form={rescheduleForm}
            onChange={(patch) => setRescheduleForm((current) => ({ ...current, ...patch }))}
            onClose={() => {
              setIsRescheduleModalVisible(false);
              setRescheduleForm(buildRescheduleFormFromOpportunity(opportunity));
            }}
            onSubmit={() => void handleRescheduleContract(contract.id)}
            pending={rescheduleMutation.isPending}
            submitLabel="Salvar remarcacao"
            title="Remarcar este show"
            visible={isRescheduleModalVisible}
          />
        </>
      ) : null}
    </SafeAreaView>
  );
}

function VenueGalleryViewer({
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
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent={false}
      visible={visible}>
      <View style={styles.viewerBackdrop}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.viewerSafeArea}>
          <View style={styles.viewerHeader}>
            <Text style={styles.viewerCounter}>
              {viewerIndex !== null ? viewerIndex + 1 : 1} / {assets.length}
            </Text>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.viewerCloseButton, pressed && styles.galleryCardPressed]}>
              <MaterialIcons color={colors.onSurface} name="close" size={22} />
            </Pressable>
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
                <Image
                  resizeMode="contain"
                  source={{ uri: asset.publicUrl }}
                  style={styles.viewerImage}
                />
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
  title?: string;
}) {
  return (
    <GlassCard padding={spacing.xl} style={styles.sectionCard} surface="panel">
      <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
      {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
      <View style={styles.sectionContent}>{children}</View>
    </GlassCard>
  );
}

function MetaLine({
  icon,
  label,
  value,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.metaLine}>
      <View style={styles.metaIconWrap}>
        <MaterialIcons color={colors.secondary} name={icon} size={18} />
      </View>
      <View style={styles.metaCopy}>
        <Text style={styles.metaLabel}>{label}</Text>
        <Text style={styles.metaValue}>{value}</Text>
      </View>
    </View>
  );
}

function MetaChip({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'secondary';
}) {
  return (
    <View style={[styles.metaChip, tone === 'secondary' && styles.metaChipSecondary]}>
      <Text style={[styles.metaChipText, tone === 'secondary' && styles.metaChipTextSecondary]}>
        {label}
      </Text>
    </View>
  );
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: 'primary' | 'secondary' | 'muted';
}) {
  return (
    <View
      style={[
        styles.statusPill,
        tone === 'primary'
          ? styles.statusPillPrimary
          : tone === 'secondary'
            ? styles.statusPillSecondary
            : styles.statusPillMuted,
      ]}>
      <Text
        style={[
          styles.statusPillText,
          tone === 'primary'
            ? styles.statusPillTextPrimary
            : tone === 'secondary'
              ? styles.statusPillTextSecondary
              : styles.statusPillTextMuted,
        ]}>
        {label}
      </Text>
    </View>
  );
}

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  const normalized = Math.max(0, Math.min(5, rating));

  return (
    <View style={styles.starRow}>
      {[0, 1, 2, 3, 4].map((index) => {
        const starValue = index + 1;
        const iconName =
          normalized >= starValue
            ? 'star'
            : normalized >= starValue - 0.5
              ? 'star-half'
              : 'star-border';

        return (
          <MaterialIcons
            key={`rating-${rating}-${starValue}`}
            color={colors.primary}
            name={iconName}
            size={size}
          />
        );
      })}
    </View>
  );
}

function formatReviewAverageValue(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  }).format(value);
}

function formatReviewCountLabel(count: number) {
  return count === 1 ? '1 avaliacao de musico' : `${count} avaliacoes de musicos`;
}

function formatReviewDateLabel(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function buildRescheduleFormFromOpportunity(
  opportunity?:
    | {
        duration_hours: number;
        event_date: string;
        location_label: string;
        start_time: string;
      }
    | null,
): ContractRescheduleFormState {
  return {
    durationHours: opportunity ? `${opportunity.duration_hours}` : '',
    eventDate: opportunity ? formatDatabaseDateForInput(opportunity.event_date) : '',
    locationLabel: opportunity?.location_label ?? '',
    reason: '',
    startTime: opportunity ? formatTimeInput(opportunity.start_time) : '',
  };
}

function formatDatabaseDateForInput(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return value;
  }

  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

function formatTimeInput(value: string) {
  const digits = value.replace(/\D+/g, '').slice(0, 4);

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function formatEventTimestamp(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  }).format(new Date(value));
}

function OpportunityDetailLoadingState({ stickyActionBottom }: { stickyActionBottom: number }) {
  return (
    <SafeAreaView edges={['left', 'right']} style={styles.screen}>
      <TopBar leftIcon="arrow-back" title="Detalhes da vaga" />
      <View style={styles.body}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: stickyActionBottom + 156 }]}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}>
          <GlassCard padding={0} style={styles.heroCard}>
            <View style={styles.loadingHeroImage} />
            <View style={styles.heroContent}>
              <LoadingBlock style={styles.loadingEyebrow} />
              <LoadingBlock style={styles.loadingHeroTitle} />
              <LoadingBlock style={styles.loadingHeroCopy} />
              <LoadingBlock style={styles.loadingChipRow} />
            </View>
          </GlassCard>

          <LoadingSection />
          <LoadingSection />
          <LoadingSection compact />
        </ScrollView>

        <View style={[styles.stickyActionWrap, { bottom: stickyActionBottom }]}>
          <GlassCard padding={spacing.lg} style={styles.feedbackCard} surface="panel">
            <LoadingBlock style={styles.loadingAction} />
          </GlassCard>
        </View>

        <BottomNav accountType="musician" active="home" />
      </View>
    </SafeAreaView>
  );
}

function LoadingSection({ compact = false }: { compact?: boolean }) {
  return (
    <GlassCard padding={spacing.xl} style={styles.sectionCard} surface="panel">
      <LoadingBlock style={styles.loadingEyebrow} />
      <LoadingBlock style={styles.loadingSectionTitle} />
      <View style={styles.sectionContent}>
        <LoadingBlock style={styles.loadingMetaLine} />
        <LoadingBlock style={styles.loadingMetaLine} />
        {!compact ? <LoadingBlock style={styles.loadingCopyBlock} /> : null}
      </View>
    </GlassCard>
  );
}

function LoadingBlock({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.loadingBlock, style]} />;
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  contentWrap: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
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
  heroContent: {
    gap: spacing.md,
    padding: spacing.xl,
  },
  heroTitle: {
    ...typography.screenTitle,
    color: colors.primary,
  },
  heroVenue: {
    ...typography.bodyBold,
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
  galleryCardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  galleryImage: {
    height: '100%',
    width: '100%',
  },
  galleryOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(13,13,22,0.62)',
    bottom: spacing.md,
    borderRadius: radii.pill,
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
  metaChip: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
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
  urgentBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: 'rgba(167,1,56,0.90)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  urgentDot: {
    width: 7,
    height: 7,
    borderRadius: radii.pill,
    backgroundColor: colors.error,
  },
  urgentLabel: {
    ...typography.label,
    color: '#ffb2b9',
  },
  priceBadge: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  priceBadgeText: {
    ...typography.bodyBold,
    color: colors.primary,
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
    ...typography.body,
    color: colors.onSurfaceVariant,
  },
  sectionContent: {
    gap: spacing.md,
  },
  metaLine: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metaIconWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,238,252,0.10)',
    borderRadius: radii.pill,
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
  applicationCard: {
    gap: spacing.md,
  },
  inlinePrimaryAction: {
    width: '100%',
  },
  inlineActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  inlineActionButton: {
    minWidth: 188,
  },
  reasonCard: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.lg,
    gap: spacing.xs,
    padding: spacing.md,
  },
  reasonLabel: {
    ...typography.label,
    color: colors.secondary,
  },
  reasonValue: {
    ...typography.bodyBold,
    color: colors.onSurface,
  },
  reasonMeta: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
  },
  historyList: {
    gap: spacing.sm,
  },
  historyTitle: {
    ...typography.bodyBold,
    color: colors.onSurface,
  },
  historyCard: {
    gap: spacing.xs,
  },
  historyLead: {
    ...typography.bodyBold,
    color: colors.onSurface,
  },
  historyMeta: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
  },
  historyReason: {
    ...typography.body,
    color: colors.onSurface,
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
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  statusPillPrimary: {
    backgroundColor: colors.primary,
  },
  statusPillSecondary: {
    backgroundColor: 'rgba(0,238,252,0.14)',
  },
  statusPillMuted: {
    backgroundColor: colors.surfaceContainerHigh,
  },
  statusPillText: {
    ...typography.label,
  },
  statusPillTextPrimary: {
    color: colors.onPrimaryFixed,
  },
  statusPillTextSecondary: {
    color: colors.secondary,
  },
  statusPillTextMuted: {
    color: colors.onSurfaceVariant,
  },
  stickyActionWrap: {
    gap: spacing.sm,
    left: spacing.lg,
    position: 'absolute',
    right: spacing.lg,
  },
  primaryAction: {
    width: '100%',
  },
  feedbackCard: {
    gap: spacing.sm,
  },
  feedbackText: {
    ...typography.bodyMedium,
    color: colors.secondary,
  },
  errorText: {
    ...typography.bodyMedium,
    color: '#ffb2b9',
  },
  viewerBackdrop: {
    backgroundColor: '#050509',
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
    paddingVertical: spacing.md,
  },
  viewerCounter: {
    ...typography.bodyBold,
    color: colors.onSurface,
  },
  viewerCloseButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(37,37,49,0.72)',
    borderRadius: radii.pill,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  viewerSlide: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xl,
  },
  viewerImage: {
    height: '100%',
    width: '100%',
  },
  loadingBlock: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: radii.pill,
    borderWidth: 1,
    overflow: 'hidden',
  },
  loadingHeroImage: {
    height: 236,
    backgroundColor: colors.surfaceContainerLowest,
  },
  loadingEyebrow: {
    height: 16,
    width: 120,
  },
  loadingHeroTitle: {
    height: 34,
    width: '74%',
  },
  loadingHeroCopy: {
    height: 18,
    width: '62%',
  },
  loadingChipRow: {
    height: 34,
    width: '100%',
  },
  loadingSectionTitle: {
    height: 30,
    width: '70%',
  },
  loadingMetaLine: {
    height: 54,
    width: '100%',
  },
  loadingCopyBlock: {
    height: 112,
    width: '100%',
  },
  loadingAction: {
    height: 56,
    width: '100%',
  },
});
