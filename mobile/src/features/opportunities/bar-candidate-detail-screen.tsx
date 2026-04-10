import { MaterialIcons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import {
  Image,
  Linking,
  Modal,
  Platform,
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
  useContractScheduleChanges,
  useRescheduleOpportunityContract,
  useSelectOpportunityCandidateForContract,
} from '@/src/features/contracts/contracts';
import {
  buildContractPaymentStatusCopy,
  canOpenPlatformCheckout,
  formatPlatformFeeLabel,
  formatContractPaymentOccurrenceDateLabel,
  formatContractPaymentStatusLabel,
  getContractPaymentTone,
  resolveOpportunityPaymentOccurrenceDate,
  useContractPaymentSnapshot,
  useCreatePlatformCheckoutSession,
} from '@/src/features/payments/payments';
import {
  CancelContractModal,
  RescheduleContractModal,
  type ContractRescheduleFormState,
} from '@/src/features/contracts/contract-operation-modals';
import {
  type ArtistReviewRecord,
  useBarCandidateDetail,
} from '@/src/features/opportunities/bar-candidates';
import { type ProfileMediaAsset } from '@/src/features/profiles/profile-media';
import {
  buildPublicMusicianTrustSignals,
  ProfileTrustSignalsCard,
} from '@/src/features/reputation/profile-reputation';
import {
  formatOpportunityBudget,
  formatOpportunityScheduleLabel,
  formatOpportunityStatusLabel,
} from '@/src/features/opportunities/opportunities';
import {
  BottomNav,
  GhostButton,
  GlassCard,
  GlowButton,
  ImageUri,
  TopBar,
} from '@/src/shared/components';
import { colors, radii, spacing, typography } from '@/src/shared/theme';

const defaultArtistImage =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCrt1x9MZ1YV-DOzUUTG9KuJgd7GOkSWSdo8aLxGeNdkKKBVX9agul9JOWv2lyEEBHZR_iqysSY0CCS4acK0sg1yRpUYrcZYrBbhAcbTY63lGvuzyG6oiYZf503WKqF4fVAIAaHXjR1zxps2keXJcWzAs3ZI7avUQOkhELUjUd29OPwFNObgoj4pMTMMVzR4J6eRH2Jxt3bd8CHLmiLsArY8rCjVX6rG_jCvdOwv6S42wNB0bv1FhPvEuAfVCVefpuxPDBodSKxpRxG';

export function BarCandidateDetailScreen({ applicationId }: { applicationId?: string }) {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const detailQuery = useBarCandidateDetail(applicationId);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const cancelContractMutation = useCancelOpportunityContract();
  const completeContractMutation = useCompleteOpportunityContract();
  const rescheduleMutation = useRescheduleOpportunityContract();
  const scheduleChangesQuery = useContractScheduleChanges(detailQuery.data?.contract?.id);
  const selectContractMutation = useSelectOpportunityCandidateForContract();
  const paymentQuery = useContractPaymentSnapshot(
    detailQuery.data?.contract?.id,
    detailQuery.data?.opportunity,
  );
  const createCheckoutMutation = useCreatePlatformCheckoutSession();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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

  if (!applicationId) {
    return (
      <SafeAreaView edges={['left', 'right']} style={styles.screen}>
        <TopBar leftIcon="arrow-back" onLeftPress={() => router.back()} title="Candidato" />
        <View style={styles.body}>
          <View style={styles.contentWrap}>
            <GlassCard padding={spacing.xl} surface="panel">
              <Text style={styles.sectionEyebrow}>Candidatura invalida</Text>
              <Text style={styles.sectionTitle}>Nao foi possivel identificar este candidato.</Text>
              <Text style={styles.sectionCopy}>
                Volte para a lista de candidatos e abra o perfil novamente.
              </Text>
            </GlassCard>
          </View>
          <BottomNav accountType="bar" active="home" />
        </View>
      </SafeAreaView>
    );
  }

  if (detailQuery.isLoading && !detailQuery.data) {
    return (
      <SafeAreaView edges={['left', 'right']} style={styles.screen}>
        <TopBar leftIcon="arrow-back" onLeftPress={() => router.back()} title="Candidato" />
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
          <BottomNav accountType="bar" active="home" />
        </View>
      </SafeAreaView>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <SafeAreaView edges={['left', 'right']} style={styles.screen}>
        <TopBar leftIcon="arrow-back" onLeftPress={() => router.back()} title="Candidato" />
        <View style={styles.body}>
          <View style={styles.contentWrap}>
            <GlassCard padding={spacing.xl} surface="panel">
              <Text style={styles.sectionEyebrow}>Erro</Text>
              <Text style={styles.sectionTitle}>Nao foi possivel abrir esse candidato.</Text>
              <Text style={styles.sectionCopy}>
                {detailQuery.error instanceof Error
                  ? detailQuery.error.message
                  : 'Tente voltar para a lista e abrir novamente.'}
              </Text>
            </GlassCard>
          </View>
          <BottomNav accountType="bar" active="home" />
        </View>
      </SafeAreaView>
    );
  }

  const {
    application,
    artist,
    contract,
    artistMediaAssets,
    artistRatingAverage,
    artistRatingCount,
    artistReviews,
    opportunity,
    opportunityActiveContract,
  } = detailQuery.data;
  const canCancelContract = contract ? canContractBeCancelled(contract.status) : false;
  const canCompleteContract = contract ? canContractBeCompleted(contract.status) : false;
  const canRescheduleContract = contract ? canContractBeCancelled(contract.status) : false;
  const isDirectInvite = application.source === 'direct_invite';
  const canCancelInvite = Boolean(contract && isDirectInvite && application.status === 'invited');
  const cancellationReason = formatContractReasonLabel(contract?.cancellation_reason);
  const scheduleChanges = scheduleChangesQuery.data ?? [];
  const paymentSnapshot = paymentQuery.data ?? null;
  const canLaunchCheckout = Boolean(
    contract &&
      paymentSnapshot &&
      canOpenPlatformCheckout(paymentSnapshot.status) &&
      contract.status === 'confirmed',
  );

  const galleryCardWidth = Math.max(screenWidth - spacing.lg * 2, 280);
  const trustSignals = buildPublicMusicianTrustSignals({
    genreCount: artist.genres.length,
    hasBaseContext: Boolean(artist.city || artist.state || artist.performanceRadiusKm !== null),
    hasCommercialProfile: Boolean(
      artist.artistCategory || artist.baseCacheCents !== null || artist.genres.length > 0,
    ),
    mediaCount: artistMediaAssets.length,
    totalReviews: artistRatingCount,
  });

  function handleGalleryScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const nextIndex = Math.round(
      event.nativeEvent.contentOffset.x / (galleryCardWidth + spacing.md),
    );
    setGalleryIndex(Math.max(0, Math.min(nextIndex, Math.max(artistMediaAssets.length - 1, 0))));
  }

  function handleViewerScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
    setViewerIndex(Math.max(0, Math.min(nextIndex, Math.max(artistMediaAssets.length - 1, 0))));
  }

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

  async function handleSelectCandidate() {
    if (!applicationId) {
      return;
    }

    setErrorMessage(null);
    setFeedback(null);

    try {
      await selectContractMutation.mutateAsync(applicationId);
      setFeedback(
        'Candidato selecionado. Agora o musico precisa confirmar a contratacao no proprio app.',
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Nao foi possivel iniciar esta contratacao.',
      );
    }
  }

  async function handleCompleteContract(contractId: string) {
    setErrorMessage(null);
    setFeedback(null);

    try {
      await completeContractMutation.mutateAsync(contractId);
      setFeedback('Show marcado como concluido. O registro agora vai para o historico da agenda.');
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
      setFeedback(
        canCancelInvite
          ? 'Convite cancelado. Esta vaga volta a ficar disponivel para outra abordagem.'
          : 'Contratacao cancelada. Este candidato sai do fluxo ativo da agenda.',
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Nao foi possivel cancelar esta contratacao.',
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
      setFeedback('Agenda remarcada. O novo horario ja aparece para o musico e para o Bar.');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Nao foi possivel remarcar esta contratacao.',
      );
    }
  }

  async function handleOpenCheckout(contractId: string) {
    const occurrenceDate = resolveOpportunityPaymentOccurrenceDate(opportunity);

    setErrorMessage(null);
    setFeedback(null);

    try {
      const checkoutSession = await createCheckoutMutation.mutateAsync({
        contractId,
        occurrenceDate,
      });

      await openCheckoutUrl(checkoutSession.checkoutUrl);
      setFeedback(
        'Checkout aberto no navegador. Depois do pagamento, volte para atualizar o status financeiro desta ocorrencia.',
      );
      await paymentQuery.refetch();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Nao foi possivel abrir o Checkout desta cobranca.',
      );
    }
  }

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.screen}>
      <TopBar leftIcon="arrow-back" onLeftPress={() => router.back()} title="Candidato" />

      <View style={styles.body}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <GlassCard padding={0} style={styles.heroCard} surface="panel">
            <View style={styles.heroImageWrap}>
              <ImageUri source={artist.coverImageUrl ?? defaultArtistImage} style={styles.heroImage} />
              <View style={styles.ratingBadge}>
                <StarRating rating={artistRatingAverage ?? 0} size={16} />
                <Text style={styles.ratingBadgeText}>
                  {artistRatingAverage !== null ? artistRatingAverage.toFixed(1) : 'Sem nota'}
                </Text>
              </View>
            </View>

            <View style={styles.heroContent}>
              <Text style={styles.sectionEyebrow}>Candidato da vaga</Text>
              <Text style={styles.heroTitle}>{artist.stageName}</Text>
              <Text style={styles.heroMeta}>
                {artist.artistCategory || 'Categoria artistica ainda nao informada'}
              </Text>
              <View style={styles.chipRow}>
                {artist.genres.map((genre) => (
                  <MetaChip key={`${artist.artistId}-${genre}`} label={genre} />
                ))}
                {[artist.city, artist.state].filter(Boolean).length > 0 ? (
                  <MetaChip
                    label={[artist.city, artist.state].filter(Boolean).join('/')}
                    tone="secondary"
                  />
                ) : null}
                {artist.performanceRadiusKm !== null ? (
                  <MetaChip label={`Raio ${artist.performanceRadiusKm} km`} />
                ) : null}
              </View>
            </View>
          </GlassCard>

          <DetailSection
            eyebrow="Status da candidatura"
            title="Contexto rapido da vaga e do momento em que este musico entrou na selecao.">
            <MetaLine icon="campaign" label="Vaga" value={opportunity.title} />
            <MetaLine icon="schedule" label="Agenda" value={formatOpportunityScheduleLabel(opportunity)} />
            {artist.baseCacheCents !== null ? (
              <MetaLine
                icon="payments"
                label="Cache base do musico"
                value={formatOpportunityBudget(artist.baseCacheCents)}
              />
            ) : null}
            <View style={styles.statusBlock}>
              <Text style={styles.statusDate}>
                {application.status === 'invited'
                  ? 'Convite enviado em '
                  : application.status === 'declined'
                    ? 'Convite respondido em '
                    : application.status === 'rejected' && Boolean(contract)
                      ? 'Convite encerrado em '
                    : 'Candidatura enviada em '}
                {new Date(application.created_at).toLocaleString('pt-BR')}
              </Text>
              <GhostButton
                icon="forum"
                label="Conversar com musico"
                onPress={() => router.push(`/chat/application/${application.id}`)}
              />
            </View>
          </DetailSection>

          <ProfileTrustSignalsCard
            eyebrow="Sinais de confianca"
            signals={trustSignals}
            title="Indicadores objetivos que ajudam o Bar a avaliar maturidade comercial, base operacional e repertorio publico deste candidato."
          />

          <DetailSection
            eyebrow="Contratacao"
            title="Escolha quem segue para confirmacao final e acompanhe o estado deste fechamento.">
            {contract ? (
              <>
                <Text style={styles.sectionCopy}>
                  {contract.status === 'pending_confirmation'
                    ? application.status === 'invited'
                      ? 'Este convite direto ja foi enviado. O proximo passo agora e a resposta do musico no app.'
                      : 'Este musico ja foi selecionado. O proximo passo agora e a confirmacao dele no app.'
                    : contract.status === 'confirmed'
                      ? 'Esta contratacao ja foi confirmada pelo musico e a vaga foi fechada para novas candidaturas.'
                      : contract.status === 'completed'
                        ? 'Este contrato ja foi concluido no fluxo operacional.'
                        : application.status === 'declined'
                          ? 'Este convite foi recusado pelo musico e deixou de bloquear a vaga.'
                          : isDirectInvite
                            ? 'Este convite foi cancelado antes da confirmacao final.'
                            : 'Esta contratacao foi cancelada anteriormente.'}
                </Text>
                <StatusPill
                  label={formatContractStatusLabel(contract.status)}
                  tone={getContractTone(contract.status)}
                />
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
                    containerStyle={styles.primaryInlineAction}
                    icon="star-rate"
                    label="Avaliar musico"
                    onPress={() => router.push(`/bar/reviews/${contract.id}`)}
                  />
                ) : null}
                {canCompleteContract || canCancelContract || canRescheduleContract ? (
                  <View style={styles.contractActionsRow}>
                    {canCompleteContract ? (
                      <GhostButton
                        containerStyle={styles.secondaryInlineAction}
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
                        containerStyle={styles.secondaryInlineAction}
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
                    {canCancelInvite ? (
                      <GhostButton
                        containerStyle={styles.secondaryInlineAction}
                        disabled={cancelContractMutation.isPending}
                        icon="close"
                        label={
                          cancelContractMutation.isPending
                            ? 'Cancelando convite'
                            : 'Cancelar convite'
                        }
                        onPress={() => setIsCancelModalVisible(true)}
                      />
                    ) : canCancelContract ? (
                      <GhostButton
                        containerStyle={styles.secondaryInlineAction}
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
              </>
            ) : opportunityActiveContract ? (
              <>
                <Text style={styles.sectionCopy}>
                  Esta vaga ja possui outra contratacao em andamento. Abra a lista de candidatos
                  para revisar quem foi escolhido.
                </Text>
                <StatusPill
                  label={formatContractStatusLabel(opportunityActiveContract.status)}
                  tone={getContractTone(opportunityActiveContract.status)}
                />
              </>
            ) : opportunity.status !== 'open' ? (
              <>
                <Text style={styles.sectionCopy}>
                  Esta vaga esta {formatOpportunityStatusLabel(opportunity.status).toLowerCase()} e
                  nao aceita uma nova contratacao neste momento.
                </Text>
                <StatusPill
                  label={formatOpportunityStatusLabel(opportunity.status)}
                  tone="muted"
                />
              </>
            ) : (
              <>
                <Text style={styles.sectionCopy}>
                  Ao selecionar este musico, o app abre uma contratacao pendente para ele confirmar.
                </Text>
                <GlowButton
                  containerStyle={styles.primaryInlineAction}
                  disabled={selectContractMutation.isPending}
                  icon="verified-user"
                  label={
                    selectContractMutation.isPending
                      ? 'Selecionando candidato'
                      : 'Selecionar para contratacao'
                  }
                  onPress={() => void handleSelectCandidate()}
                />
              </>
            )}

            {(errorMessage || feedback) && (
              <GlassCard padding={spacing.lg} style={styles.feedbackCard} surface="panel">
                {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
                {feedback ? <Text style={styles.feedbackText}>{feedback}</Text> : null}
              </GlassCard>
            )}
          </DetailSection>

          {contract ? (
            <DetailSection
              eyebrow="Pagamento"
              title="Acompanhe a cobranca desta ocorrencia e abra o Checkout hospedado da Stripe.">
              {paymentQuery.isLoading && !paymentSnapshot ? (
                <>
                  <LoadingBlock style={styles.loadingWide} />
                  <LoadingBlock style={styles.loadingMeta} />
                  <LoadingBlock style={styles.loadingMeta} />
                </>
              ) : paymentSnapshot ? (
                <>
                  <Text style={styles.sectionCopy}>
                    {buildContractPaymentStatusCopy(paymentSnapshot.status, 'bar')}
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
                  {paymentSnapshot.platformFeeCents !== null ? (
                    <MetaLine
                      icon="account-balance-wallet"
                      label={formatPlatformFeeLabel(
                        paymentSnapshot.amountCents,
                        paymentSnapshot.platformFeeCents,
                      )}
                      value={formatOpportunityBudget(paymentSnapshot.platformFeeCents)}
                    />
                  ) : null}
                  {paymentSnapshot.musicianPayoutCents !== null ? (
                    <MetaLine
                      icon="currency-exchange"
                      label="Repasse previsto ao musico"
                      value={formatOpportunityBudget(paymentSnapshot.musicianPayoutCents)}
                    />
                  ) : null}
                  {paymentSnapshot.checkoutExpiresAt ? (
                    <MetaLine
                      icon="schedule"
                      label="Checkout valido ate"
                      value={formatEventTimestamp(paymentSnapshot.checkoutExpiresAt)}
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
                      icon="lock-clock"
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
                  <View style={styles.contractActionsRow}>
                    {canLaunchCheckout ? (
                      <GlowButton
                        containerStyle={styles.primaryInlineAction}
                        disabled={createCheckoutMutation.isPending}
                        icon="open-in-new"
                        label={
                          createCheckoutMutation.isPending
                            ? 'Abrindo checkout'
                            : paymentSnapshot.status === 'checkout_open'
                              ? 'Retomar checkout'
                              : paymentSnapshot.status === 'failed'
                                ? 'Tentar pagamento novamente'
                                : paymentSnapshot.status === 'checkout_expired'
                                  ? 'Abrir novo checkout'
                                  : 'Abrir checkout do pagamento'
                        }
                        onPress={() => void handleOpenCheckout(contract.id)}
                      />
                    ) : null}
                    <GhostButton
                      containerStyle={styles.secondaryInlineAction}
                      disabled={paymentQuery.isFetching}
                      icon="refresh"
                      label={paymentQuery.isFetching ? 'Atualizando status' : 'Atualizar status'}
                      onPress={() => void paymentQuery.refetch()}
                    />
                  </View>
                </>
              ) : null}
            </DetailSection>
          ) : null}

          {artistMediaAssets.length > 0 ? (
            <DetailSection
              eyebrow="Portfolio visual"
              title="Passe pelas fotos publicas do musico e toque para abrir em tela cheia.">
              <ScrollView
                contentContainerStyle={styles.galleryRow}
                decelerationRate="fast"
                horizontal
                onMomentumScrollEnd={handleGalleryScroll}
                showsHorizontalScrollIndicator={false}
                snapToAlignment="start"
                snapToInterval={galleryCardWidth + spacing.md}>
                {artistMediaAssets.map((asset, index) => (
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
                        Foto {index + 1} de {artistMediaAssets.length}
                      </Text>
                      <MaterialIcons color={colors.onSurface} name="open-in-full" size={18} />
                    </View>
                  </Pressable>
                ))}
              </ScrollView>

              {artistMediaAssets.length > 1 ? (
                <View style={styles.galleryDots}>
                  {artistMediaAssets.map((asset, index) => (
                    <View
                      key={`${asset.id}-dot`}
                      style={[styles.galleryDot, index === galleryIndex && styles.galleryDotActive]}
                    />
                  ))}
                </View>
              ) : null}
            </DetailSection>
          ) : null}

          <DetailSection
            eyebrow="Bio e estrutura"
            title="Leitura objetiva do que esse musico entrega no palco.">
            <CopyBlock
              title="Resumo artistico"
              value={artist.bio?.trim() || 'O musico ainda nao escreveu uma bio publica.'}
            />
            <CopyBlock
              title="Estrutura e rider"
              value={
                artist.structureSummary?.trim() ||
                'O musico ainda nao detalhou estrutura, rider ou formato de palco.'
              }
            />
            <CopyBlock
              title="Repertorio"
              value={
                artist.repertoireSummary?.trim() ||
                'O musico ainda nao publicou o repertorio deste portfolio.'
              }
            />
          </DetailSection>

          <DetailSection
            eyebrow="Links publicos"
            title="Canais externos que ajudam o Bar a validar presenca digital e material de apoio.">
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
              <Text style={styles.sectionCopy}>
                Este musico ainda nao publicou links externos no perfil.
              </Text>
            ) : null}
          </DetailSection>

          <DetailSection
            eyebrow="Reputacao do musico"
            title="Como outros bares avaliaram a experiencia de contratacao e execucao deste artista.">
            {artistRatingCount > 0 ? (
              <>
                <GlassCard padding={spacing.lg} style={styles.reviewSummaryCard} surface="panel">
                  <View style={styles.reviewSummaryTop}>
                    <Text style={styles.reviewAverageValue}>
                      {formatReviewAverageValue(artistRatingAverage ?? 0)}
                    </Text>
                    <View style={styles.reviewSummaryCopy}>
                      <StarRating rating={artistRatingAverage ?? 0} size={18} />
                      <Text style={styles.reviewSummaryMeta}>
                        {formatReviewCountLabel(artistRatingCount)}
                      </Text>
                    </View>
                  </View>
                </GlassCard>

                <View style={styles.reviewList}>
                  {artistReviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </View>
              </>
            ) : (
              <Text style={styles.sectionCopy}>
                Este musico ainda nao possui avaliacoes publicas de outros bares.
              </Text>
            )}
          </DetailSection>
        </ScrollView>

        <BottomNav accountType="bar" active="home" />
      </View>

      <MediaGalleryViewer
        assets={artistMediaAssets}
        onClose={() => setViewerIndex(null)}
        onMomentumScrollEnd={handleViewerScroll}
        screenWidth={screenWidth}
        visible={viewerIndex !== null}
        viewerIndex={viewerIndex}
      />

      {contract ? (
        <>
          <CancelContractModal
            description="Explique o motivo para manter o historico visivel para o musico e para a operacao do Bar."
            onClose={() => {
              setIsCancelModalVisible(false);
              setCancelReason('');
            }}
            onReasonChange={setCancelReason}
            onSubmit={() => void handleCancelContract(contract.id)}
            pending={cancelContractMutation.isPending}
            reason={cancelReason}
            submitLabel={canCancelInvite ? 'Cancelar convite' : 'Confirmar cancelamento'}
            title={canCancelInvite ? 'Cancelar este convite' : 'Cancelar esta contratacao'}
            visible={isCancelModalVisible}
          />
          <RescheduleContractModal
            currentScheduleLabel={formatOpportunityScheduleLabel(opportunity)}
            description="Ajuste data, horario, duracao e local para registrar a remarcacao desta contratacao."
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
      <View style={styles.sectionContent}>{children}</View>
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
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.linkPressed]}>
      {content}
    </Pressable>
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

function CopyBlock({ title, value }: { title: string; value: string }) {
  return (
    <View style={styles.copyBlock}>
      <Text style={styles.copyTitle}>{title}</Text>
      <Text style={styles.copyText}>{value}</Text>
    </View>
  );
}

function ReviewCard({ review }: { review: ArtistReviewRecord }) {
  return (
    <GlassCard padding={spacing.lg} style={styles.reviewCard} surface="panel">
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
  return count === 1 ? '1 avaliacao de bar' : `${count} avaliacoes de bares`;
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

function normalizeInstagramHandle(handle: string) {
  return handle.replace(/^@+/, '').trim();
}

function buildYoutubeAppUrl(url: string) {
  const videoId = extractYoutubeVideoId(url);

  if (!videoId) {
    return url;
  }

  return `vnd.youtube://watch?v=${videoId}`;
}

function extractYoutubeVideoId(url: string) {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.replace(/^www\./, '');

    if (hostname === 'youtu.be') {
      return parsedUrl.pathname.replace(/^\/+/, '').trim() || null;
    }

    if (hostname === 'youtube.com' || hostname === 'm.youtube.com') {
      return parsedUrl.searchParams.get('v');
    }
  } catch {
    return null;
  }

  return null;
}

async function openExternalUrl(primaryUrl: string, fallbackUrl: string) {
  const canOpenPrimary = await Linking.canOpenURL(primaryUrl);

  if (canOpenPrimary) {
    await Linking.openURL(primaryUrl);
    return;
  }

  await Linking.openURL(fallbackUrl);
}

async function openCheckoutUrl(url: string) {
  if (Platform.OS === 'android') {
    const canOpenUrl = await Linking.canOpenURL(url);

    if (!canOpenUrl) {
      throw new Error('O Android nao conseguiu abrir a URL do Checkout.');
    }

    await Linking.openURL(url);
    return;
  }

  try {
    await WebBrowser.openBrowserAsync(url);
  } catch {
    await Linking.openURL(url);
  }
}

function MediaGalleryViewer({
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
    <Modal animationType="fade" onRequestClose={onClose} transparent={false} visible={visible}>
      <View style={styles.viewerBackdrop}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.viewerSafeArea}>
          <View style={styles.viewerHeader}>
            <Text style={styles.viewerCounter}>
              {viewerIndex !== null ? viewerIndex + 1 : 1} / {assets.length}
            </Text>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.viewerCloseButton, pressed && styles.pressedCard]}>
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
    ...typography.bodyBold,
    color: colors.primary,
  },
  heroContent: {
    gap: spacing.md,
    padding: spacing.xl,
  },
  heroTitle: {
    ...typography.screenTitle,
    color: colors.primary,
  },
  heroMeta: {
    ...typography.bodyBold,
    color: colors.onSurface,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
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
  metaValueLink: {
    color: colors.secondary,
    textDecorationLine: 'underline',
  },
  linkPressed: {
    opacity: 0.78,
  },
  statusBlock: {
    gap: spacing.sm,
  },
  statusDate: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
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
  primaryInlineAction: {
    width: '100%',
  },
  contractActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  secondaryInlineAction: {
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
  loadingHero: {
    backgroundColor: colors.surfaceContainerLowest,
    height: 236,
  },
  loadingBlock: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radii.pill,
    height: 18,
    width: '44%',
  },
  loadingTitle: {
    height: 32,
    width: '60%',
  },
  loadingWide: {
    width: '80%',
  },
  loadingMeta: {
    width: '100%',
  },
});
