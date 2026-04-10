# TocaAI - Observabilidade do MVP

Ultima atualizacao: 2026-04-09
Status: baseline operacional do MVP

## Objetivo

Dar ao TocaAI uma trilha minima de observabilidade para responder tres perguntas do MVP:

- o usuario esta conseguindo atravessar o funil principal
- onde os erros de runtime e de dados estao acontecendo
- o ambiente ja esta pronto para leitura executiva no Supabase

## Escopo atual

### Eventos de funil

Persistidos em `public.telemetry_events`:

- `app_session_started`
- `app_foregrounded`
- `screen_view`
- `session_restored`
- `auth_sign_in_succeeded`
- `auth_email_confirmation_completed`
- `auth_sign_out_requested`
- `auth_password_updated`
- `profile_saved`
- `profile_media_uploaded`
- `profile_media_deleted`
- `opportunity_draft_saved`
- `opportunity_published`
- `opportunity_updated`
- `opportunity_status_changed`
- `opportunity_applied`
- `direct_invite_sent`
- `direct_invite_declined`
- `direct_invite_cancelled`
- `candidate_selected_for_contract`
- `contract_confirmed`
- `contract_completed`
- `contract_cancelled`
- `contract_rescheduled`
- `chat_message_sent`
- `review_submitted`

### Captura de erros

Persistidos em `public.app_error_events`:

- falhas de `query` do TanStack Query
- falhas de `mutation` do TanStack Query
- erros criticos do runtime JS via handler global
- erros de callback/auth e recovery capturados manualmente
- falhas de tela tratadas pelo `ErrorBoundary` do app

## Limitacoes assumidas nesta fase

- a captura remota exige sessao autenticada; eventos puramente anonimos de pre-login ainda nao entram no banco
- nao existe integracao com Sentry, Crashlytics ou ferramenta externa nesta fase
- a analise fica concentrada no Supabase, sem painel dedicado no app

## Estrutura persistida

### Ingestao

- `public.log_telemetry_event(...)`
- `public.log_app_error_event(...)`

O app mobile grava via RPC autenticada, usando `auth.uid()` no Supabase, em vez de `insert` direto nas tabelas de observabilidade.

### `public.telemetry_events`

Campos principais:

- `account_id uuid`
- `account_type account_type`
- `session_id text`
- `event_name text`
- `pathname text`
- `opportunity_id uuid`
- `application_id uuid`
- `contract_id uuid`
- `context jsonb`
- `created_at timestamptz`

### `public.app_error_events`

Campos principais:

- `account_id uuid`
- `account_type account_type`
- `session_id text`
- `pathname text`
- `source text`
- `severity text`
- `message text`
- `stack text`
- `fingerprint text`
- `context jsonb`
- `created_at timestamptz`

### Views de apoio

- `public.telemetry_daily_rollup`
- `public.telemetry_error_daily_rollup`
- `public.telemetry_funnel_snapshot`

## Como usar no MVP

### Leitura rapida do funil

Consultar `public.telemetry_funnel_snapshot` para volumes totais de:

- login com sucesso
- perfis salvos
- vagas publicadas
- candidaturas
- convites diretos
- contratos confirmados
- mensagens enviadas
- reviews enviadas

### Leitura diaria

Consultar `public.telemetry_daily_rollup` para ver:

- volume por dia
- separacao por `account_type`
- eventos com maior tracao

### Diagnostico de falhas

Consultar `public.telemetry_error_daily_rollup` e depois `public.app_error_events` para:

- fonte principal da falha (`query`, `mutation`, `global_js`, `route_boundary`, `auth_*`)
- severidade (`warning`, `error`, `fatal`)
- rota (`pathname`)
- contexto serializado

## Superficies do app instrumentadas

- bootstrap e restauracao de sessao
- navegacao por rota autenticada
- auth por email, confirmacao e recovery
- salvar perfil de Bar e Musico
- upload e remocao de midia de perfil
- criar, editar, publicar e atualizar status de vaga
- candidatura no feed
- convite direto do Bar
- selecao, confirmacao, conclusao, cancelamento e remarcacao de contrato
- mensagens de chat
- reviews pos-evento

## Validacao operacional sugerida

1. Entrar como `Bar` e publicar uma vaga.
2. Entrar como `Musico` e se candidatar.
3. Trocar mensagens no chat.
4. Confirmar a contratacao.
5. Concluir o show e enviar review.
6. Consultar no Supabase:
   - `public.telemetry_events`
   - `public.app_error_events`
   - `public.telemetry_funnel_snapshot`

## Evidencia remota ja confirmada

- schema remoto aplicado com `public.telemetry_events` e `public.app_error_events`
- views `public.telemetry_daily_rollup` e `public.telemetry_funnel_snapshot` existentes
- RPCs `public.log_telemetry_event` e `public.log_app_error_event` existentes
- smoke real apos nova `release` registrando eventos `session_restored`, `app_session_started`, `screen_view` e `app_foregrounded`

## Proximos passos naturais

- ligar eventos anonimos de pre-login por RPC controlada ou edge function
- adicionar retencao e pruning operacional dos logs
- plugar provider externo de crash tracking quando o app sair do MVP
