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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  WEEKDAY_OPTIONS,
  formatOpportunityBudget,
  formatOpportunityDurationHours,
  formatOpportunityStatusLabel,
  formatRecurrenceDaysLabel,
  getOpportunityStatusTone,
  useOpportunityEditor,
  useSaveOpportunity,
  type OpportunityStatus,
  type WeekdayKey,
} from '@/src/features/opportunities/opportunities';
import {
  BottomNav,
  GlassCard,
  GhostButton,
  GlowButton,
  InputField,
  TopBar,
  getBottomNavStickyActionOffset,
} from '@/src/shared/components';
import { colors, radii, spacing, typography } from '@/src/shared/theme';

const MUSIC_GENRE_OPTIONS = [
  'Pop',
  'Pop Rock',
  'MPB',
  'Sertanejo',
  'Pagode',
  'Samba',
  'Forro',
  'Rock',
  'Jazz',
  'Blues',
  'Eletronico',
  'DJ Set',
] as const;

type OpportunityFormState = {
  artistCategory: string;
  budget: string;
  city: string;
  durationHours: string;
  eventDate: string;
  isUrgent: boolean;
  locationLabel: string;
  musicGenres: string[];
  notes: string;
  recurrenceDays: WeekdayKey[];
  startTime: string;
  state: string;
  structureSummary: string;
  title: string;
};

const EMPTY_FORM: OpportunityFormState = {
  artistCategory: '',
  budget: '',
  city: '',
  durationHours: '',
  eventDate: '',
  isUrgent: false,
  locationLabel: '',
  musicGenres: [],
  notes: '',
  recurrenceDays: [],
  startTime: '',
  state: '',
  structureSummary: '',
  title: '',
};

export function OpportunityEditorScreen({
  inviteArtistId,
  opportunityId,
}: {
  inviteArtistId?: string;
  opportunityId?: string;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const stickyActionBottom = getBottomNavStickyActionOffset(insets.bottom);
  const editorQuery = useOpportunityEditor(opportunityId);
  const saveOpportunity = useSaveOpportunity(opportunityId);
  const [form, setForm] = useState<OpportunityFormState>(EMPTY_FORM);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!editorQuery.data) {
      return;
    }

    const { opportunity, venueProfile } = editorQuery.data;

    if (opportunity) {
      setForm({
        artistCategory: opportunity.artist_category ?? '',
        budget: formatCurrencyInput(opportunity.budget_cents),
        city: opportunity.city,
        durationHours: String(opportunity.duration_hours),
        eventDate: formatDatabaseDateForInput(opportunity.event_date),
        isUrgent: opportunity.is_urgent,
        locationLabel: opportunity.location_label,
        musicGenres: opportunity.music_genres ?? [],
        notes: opportunity.notes ?? '',
        recurrenceDays: opportunity.recurrence_days ?? [],
        startTime: formatTimeInput(opportunity.start_time),
        state: opportunity.state,
        structureSummary: opportunity.structure_summary ?? '',
        title: opportunity.title,
      });
      return;
    }

    setForm({
      ...EMPTY_FORM,
      city: venueProfile?.city ?? '',
      locationLabel: buildDefaultLocationLabel(venueProfile),
      state: venueProfile?.state ?? '',
    });
  }, [editorQuery.data]);

  const venueProfile = editorQuery.data?.venueProfile ?? null;
  const currentStatus = editorQuery.data?.opportunity?.status ?? 'draft';
  const isEditing = Boolean(opportunityId);
  const stickyPaddingBottom = stickyActionBottom + 164;
  const recurrenceSummary =
    form.recurrenceDays.length > 0
      ? `Toda ${formatRecurrenceDaysLabel(form.recurrenceDays, 'long')}`
      : null;
  const parsedBudget = parseCurrencyToCents(form.budget);
  const parsedDurationHours = parseInteger(form.durationHours);

  async function handleSubmit(status: OpportunityStatus) {
    setErrorMessage(null);
    setFeedback(null);

    try {
      const savedId = await saveOpportunity.mutateAsync({
        artistCategory: form.artistCategory,
        budgetCents: parsedBudget,
        city: form.city,
        durationHours: parsedDurationHours,
        eventDate: normalizeDateForSave(form.eventDate),
        isUrgent: form.isUrgent,
        locationLabel: form.locationLabel,
        musicGenres: form.musicGenres,
        notes: form.notes,
        recurrenceDays: form.recurrenceDays,
        startTime: normalizeTimeForSave(form.startTime),
        state: form.state,
        status,
        structureSummary: form.structureSummary,
        title: form.title,
      });

      if (inviteArtistId) {
        router.replace(`/bar/invite/${inviteArtistId}?opportunityId=${savedId}`);
        return;
      }

      if (!opportunityId) {
        router.replace(`/bar/opportunities/${savedId}`);
        return;
      }

      if (status === 'open' && form.recurrenceDays.length > 0) {
        setFeedback('Vaga recorrente publicada e disponivel no feed do Musico.');
        return;
      }

      setFeedback(
        status === 'open'
          ? 'Vaga publicada e disponivel no feed do Musico.'
          : 'Vaga salva como rascunho. Ela ainda nao aparece para os musicos.',
      );
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Nao foi possivel salvar a vaga.'));
    }
  }

  if (editorQuery.isLoading && !editorQuery.data) {
    return <OpportunityEditorLoadingState stickyActionBottom={stickyActionBottom} />;
  }

  if (editorQuery.isError) {
    return (
      <SafeAreaView edges={['left', 'right']} style={styles.screen}>
        <TopBar leftIcon="arrow-back" onLeftPress={() => router.back()} title="Vaga do Bar" />
        <View style={styles.body}>
          <View style={styles.contentWrap}>
            <GlassCard padding={spacing.xl} surface="panel">
              <Text style={styles.sectionEyebrow}>Erro de carregamento</Text>
              <Text style={styles.sectionTitle}>Nao foi possivel abrir esta vaga.</Text>
              <Text style={styles.sectionCopy}>
                {editorQuery.error instanceof Error
                  ? editorQuery.error.message
                  : 'Tente voltar para a home do Bar e abrir novamente.'}
              </Text>
              <GhostButton label="Voltar para a home" onPress={() => router.replace('/bar/home')} />
            </GlassCard>
          </View>
          <BottomNav accountType="bar" active="home" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.screen}>
      <TopBar
        leftIcon="arrow-back"
        onLeftPress={() => router.back()}
        title={isEditing ? 'Editar vaga' : 'Nova vaga'}
      />

      <View style={styles.body}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: stickyPaddingBottom }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <GlassCard padding={spacing.xl} style={styles.heroCard}>
            <View style={styles.heroTop}>
              <View style={styles.heroIconWrap}>
                <MaterialIcons color={colors.primary} name="campaign" size={24} />
              </View>
              <StatusBadge
                label={formatOpportunityStatusLabel(currentStatus)}
                tone={getOpportunityStatusTone(currentStatus)}
              />
            </View>

            <Text style={styles.sectionEyebrow}>Operacao do marketplace</Text>
            <Text style={styles.heroTitle}>
              {isEditing ? form.title.trim() || 'Atualize sua vaga' : 'Publice uma vaga real para o feed do Musico.'}
            </Text>
            <Text style={styles.sectionCopy}>
              Agora a vaga suporta recorrencia por dia da semana, duracao em horas e estilos musicais por chips.
            </Text>

            <View style={styles.metaGrid}>
              <MetaBlock
                label="Casa base"
                value={
                  venueProfile?.venue_name?.trim() || 'Complete o perfil do Bar antes de publicar'
                }
              />
              <MetaBlock
                label="Local padrao"
                value={
                  buildDefaultLocationLabel(venueProfile) ||
                  'Defina um local de referencia para a vaga'
                }
              />
              {parsedDurationHours ? (
                <MetaBlock
                  label="Duracao"
                  value={formatOpportunityDurationHours(parsedDurationHours)}
                />
              ) : null}
              {recurrenceSummary ? <MetaBlock label="Recorrencia" value={recurrenceSummary} /> : null}
            </View>
          </GlassCard>

          <EditorSection
            eyebrow="Titulo e contexto"
            title="Como essa oportunidade vai aparecer para o artista.">
            <InputField
              icon="title"
              onChangeText={(value) => updateForm(setForm, 'title', value)}
              placeholder="Ex.: Noite Pop Rock de sexta"
              value={form.title}
            />
            <InputField
              icon="groups"
              onChangeText={(value) => updateForm(setForm, 'artistCategory', value)}
              placeholder="Categoria desejada: solo, dupla, banda, DJ..."
              value={form.artistCategory}
            />
            <View style={styles.toggleRow}>
              <SelectableChip
                active={form.isUrgent}
                label="Marcar como urgente"
                onPress={() => updateForm(setForm, 'isUrgent', !form.isUrgent)}
              />
            </View>
          </EditorSection>

          <EditorSection
            eyebrow="Estilo musical"
            title="Selecione um ou mais estilos em vez de digitar manualmente.">
            <View style={styles.toggleRow}>
              {MUSIC_GENRE_OPTIONS.map((genre) => (
                <SelectableChip
                  active={form.musicGenres.includes(genre)}
                  key={genre}
                  label={genre}
                  onPress={() =>
                    updateForm(setForm, 'musicGenres', toggleStringItem(form.musicGenres, genre))
                  }
                />
              ))}
            </View>
            {form.musicGenres.length > 0 ? (
              <Text style={styles.helperText}>
                Estilos selecionados: {form.musicGenres.join(', ')}
              </Text>
            ) : (
              <Text style={styles.helperText}>
                Escolha um ou mais estilos para publicar a vaga.
              </Text>
            )}
          </EditorSection>

          <EditorSection
            eyebrow="Data, hora e orcamento"
            title="Use a data da primeira ocorrencia e informe a duracao em horas.">
            <View style={styles.row}>
              <InputField
                containerStyle={styles.flexInput}
                icon="event"
                keyboardType="number-pad"
                maxLength={10}
                onChangeText={(value) => handleDateInputChange(setForm, value)}
                placeholder="DD/MM/AAAA"
                value={form.eventDate}
              />
              <InputField
                containerStyle={styles.timeInput}
                icon="schedule"
                keyboardType="number-pad"
                maxLength={5}
                onChangeText={(value) => handleTimeInputChange(setForm, value)}
                placeholder="HH:MM"
                value={form.startTime}
              />
            </View>
            <View style={styles.row}>
              <InputField
                containerStyle={styles.flexInput}
                icon="timer"
                keyboardType="number-pad"
                onChangeText={(value) => updateForm(setForm, 'durationHours', onlyDigits(value))}
                placeholder="Duracao em horas"
                value={form.durationHours}
              />
              <InputField
                containerStyle={styles.flexInput}
                icon="payments"
                keyboardType="decimal-pad"
                onChangeText={(value) => updateForm(setForm, 'budget', normalizeCurrencyInput(value))}
                placeholder="Orcamento em R$"
                value={form.budget}
              />
            </View>
            {parsedBudget !== null ? (
              <Text style={styles.helperText}>
                Valor da vaga: {formatOpportunityBudget(parsedBudget)}
              </Text>
            ) : null}
          </EditorSection>

          <EditorSection
            eyebrow="Recorrencia semanal"
            title="Se marcar dias, a vaga passa a aparecer como recorrente no feed.">
            <View style={styles.toggleRow}>
              {WEEKDAY_OPTIONS.map((day) => (
                <SelectableChip
                  active={form.recurrenceDays.includes(day.key)}
                  key={day.key}
                  label={day.label}
                  onPress={() =>
                    setForm((current) => ({
                      ...current,
                      recurrenceDays: toggleWeekday(current.recurrenceDays, day.key),
                    }))
                  }
                />
              ))}
            </View>
            {recurrenceSummary ? (
              <Text style={styles.helperText}>
                Recorrencia ativa: {recurrenceSummary}. A data informada funciona como primeira ocorrencia da serie.
              </Text>
            ) : (
              <Text style={styles.helperText}>
                Sem dias marcados, a vaga continua sendo tratada como evento pontual.
              </Text>
            )}
          </EditorSection>

          <EditorSection
            eyebrow="Local e estrutura"
            title="Referencia do evento e estrutura disponivel no local.">
            <InputField
              icon="place"
              onChangeText={(value) => updateForm(setForm, 'locationLabel', value)}
              placeholder="Ex.: Bar do Leo - Jardim Maia"
              value={form.locationLabel}
            />
            <View style={styles.row}>
              <InputField
                containerStyle={styles.flexInput}
                icon="location-city"
                onChangeText={(value) => updateForm(setForm, 'city', value)}
                placeholder="Cidade"
                value={form.city}
              />
              <InputField
                containerStyle={styles.stateInput}
                autoCapitalize="characters"
                icon="map"
                maxLength={2}
                onChangeText={(value) => updateForm(setForm, 'state', value.toUpperCase())}
                placeholder="UF"
                value={form.state}
              />
            </View>
            <InputField
              icon="speaker"
              multiline
              numberOfLines={5}
              onChangeText={(value) => updateForm(setForm, 'structureSummary', value)}
              placeholder="Palco, PA, retorno, energia, microfones e observacoes de estrutura."
              value={form.structureSummary}
            />
          </EditorSection>

          <EditorSection
            eyebrow="Observacoes"
            title="Detalhes operacionais para o artista decidir rapido.">
            <InputField
              icon="notes"
              multiline
              numberOfLines={6}
              onChangeText={(value) => updateForm(setForm, 'notes', value)}
              placeholder="Dress code, publico esperado, repertorio desejado, jantar incluso ou restricoes do local."
              value={form.notes}
            />
          </EditorSection>
        </ScrollView>

        <View style={[styles.stickyActionWrap, { bottom: stickyActionBottom }]}>
          {(errorMessage || feedback) && (
            <GlassCard padding={spacing.lg} style={styles.feedbackCard} surface="panel">
              {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
              {feedback ? <Text style={styles.feedbackText}>{feedback}</Text> : null}
            </GlassCard>
          )}

          <GhostButton
            disabled={saveOpportunity.isPending}
            icon="drafts"
            label={saveOpportunity.isPending ? 'Salvando vaga' : 'Salvar rascunho'}
            onPress={() => void handleSubmit('draft')}
          />
          <GlowButton
            containerStyle={styles.primaryAction}
            disabled={saveOpportunity.isPending}
            icon="rocket-launch"
            label={saveOpportunity.isPending ? 'Publicando vaga' : 'Publicar vaga'}
            onPress={() => void handleSubmit('open')}
          />
        </View>

        <BottomNav accountType="bar" active="home" />
      </View>
    </SafeAreaView>
  );
}

function EditorSection({
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

function OpportunityEditorLoadingState({ stickyActionBottom }: { stickyActionBottom: number }) {
  return (
    <SafeAreaView edges={['left', 'right']} style={styles.screen}>
      <TopBar leftIcon="arrow-back" title="Vaga do Bar" />
      <View style={styles.body}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: stickyActionBottom + 164 }]}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}>
          <GlassCard padding={spacing.xl} style={styles.heroCard}>
            <View style={styles.heroTop}>
              <LoadingBlock style={styles.loadingIcon} />
              <LoadingBlock style={styles.loadingBadge} />
            </View>
            <LoadingBlock style={styles.loadingEyebrow} />
            <LoadingBlock style={styles.loadingTitle} />
            <LoadingBlock style={styles.loadingCopy} />
            <LoadingBlock style={styles.loadingMeta} />
            <LoadingBlock style={styles.loadingMeta} />
          </GlassCard>

          <EditorLoadingSection />
          <EditorLoadingSection />
          <EditorLoadingSection compact />
        </ScrollView>

        <View style={[styles.stickyActionWrap, { bottom: stickyActionBottom }]}>
          <GlassCard padding={spacing.lg} style={styles.feedbackCard} surface="panel">
            <LoadingBlock style={styles.loadingAction} />
            <LoadingBlock style={styles.loadingAction} />
          </GlassCard>
        </View>

        <BottomNav accountType="bar" active="home" />
      </View>
    </SafeAreaView>
  );
}

function EditorLoadingSection({ compact = false }: { compact?: boolean }) {
  return (
    <GlassCard padding={spacing.xl} style={styles.sectionCard} surface="panel">
      <LoadingBlock style={styles.loadingEyebrow} />
      <LoadingBlock style={styles.loadingSectionTitle} />
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

function updateForm<K extends keyof OpportunityFormState>(
  setForm: Dispatch<SetStateAction<OpportunityFormState>>,
  key: K,
  value: OpportunityFormState[K],
) {
  setForm((current) => ({
    ...current,
    [key]: value,
  }));
}

function toggleWeekday(items: WeekdayKey[], value: WeekdayKey) {
  return items.includes(value) ? items.filter((item) => item !== value) : [...items, value];
}

function toggleStringItem(items: string[], value: string) {
  return items.includes(value) ? items.filter((item) => item !== value) : [...items, value];
}

function buildDefaultLocationLabel(
  venueProfile:
    | {
        address_text: string | null;
        city: string | null;
        state: string | null;
        venue_name: string | null;
      }
    | null
    | undefined,
) {
  if (!venueProfile) {
    return '';
  }

  return (
    venueProfile.address_text?.trim() ||
    [venueProfile.venue_name, venueProfile.city, venueProfile.state]
      .filter((value): value is string => Boolean(value?.trim()))
      .join(' - ')
  );
}

function onlyDigits(value: string) {
  return value.replace(/\D+/g, '');
}

function handleDateInputChange(
  setForm: Dispatch<SetStateAction<OpportunityFormState>>,
  value: string,
) {
  updateForm(setForm, 'eventDate', formatDateInput(value));
}

function handleTimeInputChange(
  setForm: Dispatch<SetStateAction<OpportunityFormState>>,
  value: string,
) {
  updateForm(setForm, 'startTime', formatTimeInput(value));
}

function formatDateInput(value: string) {
  const digits = onlyDigits(value).slice(0, 8);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function formatDatabaseDateForInput(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return formatDateInput(value);
  }

  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

function normalizeDateForSave(value: string) {
  const digits = onlyDigits(value).slice(0, 8);

  if (digits.length !== 8) {
    return value;
  }

  return `${digits.slice(4, 8)}-${digits.slice(2, 4)}-${digits.slice(0, 2)}`;
}

function formatTimeInput(value: string) {
  const digits = onlyDigits(value).slice(0, 4);

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function normalizeTimeForSave(value: string) {
  const digits = onlyDigits(value).slice(0, 4);

  if (digits.length !== 4) {
    return value;
  }

  return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
}

function normalizeCurrencyInput(value: string) {
  return value.replace(/[^\d,]/g, '');
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

function parseInteger(value: string) {
  const normalized = onlyDigits(value);
  return normalized ? Number(normalized) : null;
}

function formatCurrencyInput(value: number) {
  const formatted = (value / 100).toFixed(2).replace('.', ',');
  return formatted.endsWith(',00') ? formatted.slice(0, -3) : formatted;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string' &&
    error.message.trim()
  ) {
    return error.message;
  }

  return fallback;
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
    gap: spacing.md,
  },
  heroTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroIconWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(243,255,202,0.10)',
    borderColor: 'rgba(243,255,202,0.18)',
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  heroTitle: {
    ...typography.screenTitle,
    color: colors.primary,
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
  sectionCopy: {
    ...typography.body,
    color: colors.onSurfaceVariant,
  },
  sectionContent: {
    gap: spacing.md,
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
  timeInput: {
    width: 112,
  },
  toggleRow: {
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
  stickyActionWrap: {
    gap: spacing.sm,
    left: spacing.lg,
    position: 'absolute',
    right: spacing.lg,
  },
  primaryAction: {
    width: '100%',
  },
  loadingBlock: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: radii.pill,
    borderWidth: 1,
    overflow: 'hidden',
  },
  loadingIcon: {
    borderRadius: radii.pill,
    height: 44,
    width: 44,
  },
  loadingBadge: {
    height: 30,
    width: 104,
  },
  loadingEyebrow: {
    height: 16,
    width: 112,
  },
  loadingTitle: {
    height: 34,
    width: '76%',
  },
  loadingCopy: {
    height: 18,
    width: '92%',
  },
  loadingMeta: {
    height: 18,
    width: '68%',
  },
  loadingSectionTitle: {
    height: 30,
    width: '74%',
  },
  loadingInput: {
    height: 60,
    width: '100%',
  },
  loadingInputTall: {
    height: 136,
    width: '100%',
  },
  loadingAction: {
    height: 48,
    width: '100%',
  },
});
