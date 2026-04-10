# TocaAI - Modelo de Dados Inicial

Ultima atualizacao: 2026-04-09
Status: baseline inicial para cadastro, perfis, midia, oportunidades, convites, candidaturas, chat, reputacao, observabilidade e fundacao de pagamentos

## Objetivo

Materializar no Supabase a primeira camada persistida do TocaAI para suportar:

- autenticacao por email e senha
- escolha entre conta `bar` e `musician`
- criacao automatica do registro principal da conta apos signup
- base de perfis do estabelecimento e do artista
- primeiros catalogos de genero musical

## Principios

- `auth.users` continua como fonte de identidade autenticada
- o app nunca consulta `auth.users` diretamente pela API publica
- dados do produto ficam em tabelas do schema `public`
- toda tabela exposta pela API publica opera com RLS habilitado
- o cadastro cria dados minimos automaticamente via trigger

## Entidades iniciais

### `public.accounts`

Representa a conta do produto vinculada ao usuario autenticado.

Campos principais:

- `id uuid` PK, FK para `auth.users(id)`
- `account_type account_type`
- `email text`
- `display_name text`
- `profile_completed boolean`
- `onboarding_completed boolean`
- `created_at timestamptz`
- `updated_at timestamptz`

Regras:

- uma conta por usuario autenticado
- `account_type` define se a jornada segue como `bar` ou `musician`

### `public.venue_profiles`

Perfil do contratante.

Campos principais:

- `account_id uuid` PK, FK para `accounts(id)`
- `venue_name text`
- `venue_type text`
- `postal_code text`
- `street text`
- `address_number text`
- `address_complement text`
- `city text`
- `state text`
- `neighborhood text`
- `address_text text`
- `capacity integer`
- `performance_days text[]`
- `bio text`
- `cover_image_url text`
- `created_at timestamptz`
- `updated_at timestamptz`

Observacao:

- `cover_image_url` passa a ser sincronizado automaticamente com a primeira imagem cadastrada em `venue_media_assets`

### `public.artist_profiles`

Perfil artistico do musico.

Campos principais:

- `account_id uuid` PK, FK para `accounts(id)`
- `stage_name text`
- `artist_category text`
- `postal_code text`
- `city text`
- `state text`
- `performance_radius_km integer`
- `base_cache_cents integer`
- `bio text`
- `structure_summary text`
- `repertoire_summary text`
- `instagram_handle text`
- `youtube_url text`
- `created_at timestamptz`
- `updated_at timestamptz`

### `public.venue_media_assets`

Galeria de fotos do estabelecimento.

Campos principais:

- `id uuid` PK
- `venue_id uuid` FK para `venue_profiles(account_id)`
- `storage_path text`
- `public_url text`
- `mime_type text`
- `file_size_bytes integer`
- `width integer`
- `height integer`
- `sort_order integer`
- `created_at timestamptz`
- `updated_at timestamptz`

### `public.artist_media_assets`

Galeria de fotos do portfolio do musico.

Campos principais:

- `id uuid` PK
- `artist_id uuid` FK para `artist_profiles(account_id)`
- `storage_path text`
- `public_url text`
- `mime_type text`
- `file_size_bytes integer`
- `width integer`
- `height integer`
- `sort_order integer`
- `created_at timestamptz`
- `updated_at timestamptz`

### `public.opportunities`

Vagas publicadas pelo estabelecimento para alimentar o feed inicial do marketplace.

Campos principais:

- `id uuid` PK
- `venue_id uuid` FK para `venue_profiles(account_id)`
- `title text`
- `event_date date`
- `start_time time`
- `duration_hours integer`
- `recurrence_days text[]`
- `music_genres text[]`
- `artist_category text`
- `budget_cents integer`
- `city text`
- `state text`
- `location_label text`
- `structure_summary text`
- `notes text`
- `is_urgent boolean`
- `status opportunity_status`
- `created_at timestamptz`
- `updated_at timestamptz`

Status previstos:

- `draft`
- `open`
- `closed`
- `cancelled`

### `public.opportunity_applications`

Registro de candidaturas do Musico e de convites diretos do Bar nas vagas publicadas.

Campos principais:

- `id uuid` PK
- `opportunity_id uuid` FK para `opportunities(id)`
- `artist_id uuid` FK para `artist_profiles(account_id)`
- `source opportunity_application_source`
- `status opportunity_application_status`
- `created_at timestamptz`
- `updated_at timestamptz`

Restricao principal:

- unicidade em `opportunity_id + artist_id` para impedir candidatura duplicada na mesma vaga

Origens previstas:

- `marketplace_apply`
- `direct_invite`

Status previstos:

- `invited`
- `submitted`
- `shortlisted`
- `rejected`
- `accepted`
- `declined`
- `withdrawn`

Observacoes:

- a candidatura do Musico agora entra pela RPC `public.apply_to_open_opportunity(uuid)`, em vez de `insert` direto no client
- isso permite validar elegibilidade explicita da vaga e reduzir dependencia de mensagens genericas de RLS

### `public.contracts`

Registro formal da contratacao derivada de uma candidatura especifica.

Campos principais:

- `id uuid` PK
- `application_id uuid` FK unico para `opportunity_applications(id)`
- `opportunity_id uuid` FK para `opportunities(id)`
- `venue_id uuid` FK para `venue_profiles(account_id)`
- `artist_id uuid` FK para `artist_profiles(account_id)`
- `status contract_status`
- `confirmed_at timestamptz`
- `completed_at timestamptz`
- `cancelled_at timestamptz`
- `cancellation_reason text`
- `cancelled_by uuid` FK para `accounts(id)`
- `last_rescheduled_at timestamptz`
- `last_rescheduled_by uuid` FK para `accounts(id)`
- `last_reschedule_reason text`
- `created_at timestamptz`
- `updated_at timestamptz`

Status previstos:

- `pending_confirmation`
- `confirmed`
- `completed`
- `cancelled`

Observacoes:

- existe no maximo `1` contratacao ativa por vaga
- a mesma estrutura de `contracts` suporta tanto a selecao do Bar sobre uma candidatura existente quanto o convite direto a partir do perfil publico do Musico
- a selecao pelo Bar, o convite direto, a confirmacao pelo Musico e a recusa/cancelamento do convite acontecem via RPCs publicas seguras, nao por `insert/update` direto no client
- ao confirmar a contratacao, a candidatura selecionada vai para `accepted`, as demais candidaturas da vaga vao para `rejected` e a vaga muda para `closed`
- no fluxo de convite direto, a candidatura nasce como `invited`, o contrato nasce como `pending_confirmation`, a recusa do Musico move a candidatura para `declined` e o cancelamento do Bar encerra o contrato pendente
- o cancelamento operacional agora registra motivo e autoria em `contracts`
- a remarcacao operacional atualiza a agenda em `opportunities` e toca o ultimo motivo/data em `contracts`

### `public.account_payment_profiles`

Identidade financeira do Bar na cobranca Stripe e conta conectada do Musico para repasses.

Campos principais:

- `account_id uuid` PK, FK para `accounts(id)`
- `stripe_customer_id text`
- `billing_email text`
- `default_payment_method_id text`
- `last_checkout_at timestamptz`
- `stripe_connected_account_id text`
- `stripe_connected_account_status stripe_connected_account_status`
- `stripe_connect_country text`
- `stripe_connect_dashboard text`
- `stripe_transfers_capability_status text`
- `stripe_payouts_capability_status text`
- `stripe_requirements_due text[]`
- `stripe_requirements_pending text[]`
- `stripe_requirements_disabled_reason text`
- `stripe_onboarding_completed_at timestamptz`
- `stripe_last_connect_sync_at timestamptz`
- `stripe_last_payout_attempt_at timestamptz`
- `created_at timestamptz`
- `updated_at timestamptz`

Observacoes:

- o `stripe_customer_id` continua cobrindo o lado `Bar`
- a conta conectada do Musico passa a ser sincronizada pelas Edge Functions, nao pelo client mobile
- o status `stripe_connected_account_status` resume se o repasse pode ou nao ser executado

### `public.contract_payment_occurrences`

Unidade faturavel de uma contratacao, preparada para eventos unicos e recorrentes.

Campos principais:

- `id uuid` PK
- `contract_id uuid` FK para `contracts(id)`
- `opportunity_id uuid` FK para `opportunities(id)`
- `venue_id uuid` FK para `venue_profiles(account_id)`
- `artist_id uuid` FK para `artist_profiles(account_id)`
- `occurrence_date date`
- `charge_kind contract_payment_charge_kind`
- `status contract_payment_occurrence_status`
- `currency text`
- `amount_cents integer`
- `platform_fee_cents integer`
- `musician_payout_cents integer`
- `checkout_expires_at timestamptz`
- `release_after timestamptz`
- `stripe_customer_id text`
- `stripe_checkout_session_id text`
- `stripe_payment_intent_id text`
- `stripe_charge_id text`
- `stripe_transfer_id text`
- `paid_at timestamptz`
- `transferred_at timestamptz`
- `refunded_at timestamptz`
- `failed_at timestamptz`
- `failure_code text`
- `failure_message text`
- `metadata jsonb`
- `created_at timestamptz`
- `updated_at timestamptz`

Charge kinds previstos:

- `single_event`
- `deposit`
- `balance`

Status previstos:

- `draft`
- `checkout_open`
- `payment_pending`
- `funds_held`
- `transfer_pending`
- `transferred`
- `transfer_reversed`
- `checkout_expired`
- `failed`
- `refunded`
- `cancelled`

Observacoes:

- a fundacao atual ja prepara ocorrencias independentes para eventos recorrentes
- o Bar continua sendo o unico ator que inicia Checkout nesta etapa
- o split entre fee da plataforma e payout do Musico fica persistido por ocorrencia
- transferencias reais para o Musico ainda nao foram ligadas nesta fase

### `public.telemetry_events`

Eventos de funil e navegacao autenticada do MVP.

Campos principais:

- `id uuid` PK
- `account_id uuid` FK para `accounts(id)`
- `account_type account_type`
- `session_id text`
- `event_name text`
- `pathname text`
- `opportunity_id uuid` FK para `opportunities(id)`
- `application_id uuid` FK para `opportunity_applications(id)`
- `contract_id uuid` FK para `contracts(id)`
- `context jsonb`
- `created_at timestamptz`

Observacoes:

- a escrita atual e permitida apenas para o proprio usuario autenticado
- a camada mobile dispara eventos de auth, perfil, midia, vaga, candidatura, convite, contrato, chat, review e `screen_view`

### `public.app_error_events`

Falhas criticas de runtime e camada de dados do MVP.

Campos principais:

- `id uuid` PK
- `account_id uuid` FK para `accounts(id)`
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

Observacoes:

- o app registra falhas de `query`, `mutation`, `global_js`, `route_boundary` e auth
- a trilha de erros ainda e autenticada; pre-login continua fora do baseline remoto nesta fase

### Views auxiliares

- `public.telemetry_daily_rollup`
- `public.telemetry_error_daily_rollup`
- `public.telemetry_funnel_snapshot`

### `public.contract_schedule_changes`

Historico de remarcacoes de agenda vinculado ao contrato.

Campos principais:

- `id uuid` PK
- `contract_id uuid` FK para `contracts(id)`
- `opportunity_id uuid` FK para `opportunities(id)`
- `changed_by uuid` FK para `accounts(id)`
- `reason text`
- `previous_event_date date`
- `previous_start_time time`
- `previous_duration_hours integer`
- `previous_location_label text`
- `new_event_date date`
- `new_start_time time`
- `new_duration_hours integer`
- `new_location_label text`
- `created_at timestamptz`

Observacoes:

- somente participantes do contrato podem consultar esse historico
- cada remarcacao preserva o antes/depois completo de data, horario, duracao e local
- o estado atual da agenda continua vindo de `opportunities`; esta tabela serve como trilha operacional

### `public.opportunity_chat_threads`

Thread contextual criada automaticamente para cada candidatura.

Campos principais:

- `id uuid` PK
- `application_id uuid` FK unico para `opportunity_applications(id)`
- `opportunity_id uuid` FK para `opportunities(id)`
- `venue_id uuid` FK para `venue_profiles(account_id)`
- `artist_id uuid` FK para `artist_profiles(account_id)`
- `created_at timestamptz`
- `updated_at timestamptz`

Observacoes:

- existe exatamente `1` thread por candidatura
- o backfill cobre candidaturas criadas antes da entrada do modulo de chat
- `updated_at` e tocado automaticamente quando uma nova mensagem entra

### `public.opportunity_chat_messages`

Mensagens de texto trocadas dentro da thread contextual da candidatura.

Campos principais:

- `id uuid` PK
- `thread_id uuid` FK para `opportunity_chat_threads(id)`
- `sender_id uuid` FK para `accounts(id)`
- `body text`
- `created_at timestamptz`

Observacoes:

- o MVP atual suporta apenas texto
- cada mensagem pertence a uma thread unica e herda o contexto da candidatura
- o app renderiza esse historico tanto pela inbox comum quanto pela tela da conversa

### `public.venue_reviews`

Historico publico de avaliacoes do estabelecimento visivel no detalhe da vaga para o Musico.

Campos principais:

- `id uuid` PK
- `venue_id uuid` FK para `venue_profiles(account_id)`
- `opportunity_id uuid` FK opcional para `opportunities(id)`
- `author_artist_id uuid` FK opcional para `artist_profiles(account_id)`
- `reviewer_name text`
- `reviewer_city text`
- `rating integer`
- `punctuality_rating integer`
- `quality_rating integer`
- `professionalism_rating integer`
- `comment text`
- `created_at timestamptz`
- `updated_at timestamptz`

Observacoes:

- `author_artist_id` pode ficar nulo em seeds ou cargas legadas de homologacao
- reviews reais de app agora exigem `contract` concluido entre as partes
- `rating` passa a ser recalculado automaticamente a partir dos tres criterios
- o app calcula media e quantidade de reviews a partir dessa tabela para exibir a reputacao da casa
- o baseline atual inclui `3` reviews seedadas para o Bar existente, com finalidade de visualizacao e homologacao da UI

### `public.artist_reviews`

Historico publico de avaliacoes do Musico visivel para o Bar no detalhe da candidatura.

Campos principais:

- `id uuid` PK
- `artist_id uuid` FK para `artist_profiles(account_id)`
- `opportunity_id uuid` FK opcional para `opportunities(id)`
- `author_venue_id uuid` FK opcional para `venue_profiles(account_id)`
- `reviewer_name text`
- `reviewer_city text`
- `rating integer`
- `punctuality_rating integer`
- `quality_rating integer`
- `professionalism_rating integer`
- `comment text`
- `created_at timestamptz`
- `updated_at timestamptz`

Observacoes:

- `author_venue_id` pode ficar nulo em seeds ou cargas legadas de homologacao
- reviews reais de app agora exigem `contract` concluido entre as partes
- `rating` passa a ser recalculado automaticamente a partir dos tres criterios
- o app calcula media e quantidade de reviews a partir dessa tabela para exibir a reputacao do Musico no detalhe do candidato
- o baseline atual inclui `3` reviews seedadas para o Musico existente, com finalidade de visualizacao e homologacao da UI

### `public.genres`

Catalogo simples de estilos musicais.

Campos principais:

- `id bigint` PK
- `name text`
- `slug text`
- `created_at timestamptz`

### `public.artist_genres`

Relacao N:N entre artista e genero.

Campos principais:

- `artist_id uuid` FK para `artist_profiles(account_id)`
- `genre_id bigint` FK para `genres(id)`
- `created_at timestamptz`

Chave primaria composta:

- `artist_id`
- `genre_id`

## Fluxo de cadastro persistido

1. o app executa `signUp` no Supabase Auth com `account_type` no metadata
2. o Supabase cria a linha em `auth.users`
3. o trigger `public.handle_new_user()` cria:
   - uma linha em `public.accounts`
   - uma linha em `public.venue_profiles` ou `public.artist_profiles`
4. o app passa a conseguir ler o proprio registro pela API publica

## Politicas iniciais de acesso

### `accounts`

- leitura apenas da propria conta
- update apenas da propria conta

### `venue_profiles`

- leitura por usuarios autenticados
- insert e update apenas pelo proprio `account_id`

### `artist_profiles`

- leitura por usuarios autenticados
- insert e update apenas pelo proprio `account_id`

### `genres`

- leitura por usuarios autenticados

### `artist_genres`

- leitura por usuarios autenticados
- insert e delete apenas pelo proprio artista

### `venue_media_assets`

- leitura por usuarios autenticados
- insert, update e delete apenas pelo proprio `venue_id`

### `artist_media_assets`

- leitura por usuarios autenticados
- insert, update e delete apenas pelo proprio `artist_id`

### `opportunities`

- leitura por usuarios autenticados quando a vaga estiver `open`, pelo proprio `venue_id` em qualquer status, ou pelo Musico que ja se candidatou
- insert, update e delete apenas pelo proprio `venue_id`

### `opportunity_applications`

- leitura pelo proprio `artist_id` e pelo `venue_id` dono da vaga
- insert apenas pelo proprio `artist_id`
- insert permitido somente quando a vaga estiver `open`
- insert direto pela API publica exige `status = submitted` e `source = marketplace_apply`
- convites diretos do Bar sao criados por `public.create_direct_opportunity_invite(uuid, uuid)` e nao por `insert` direto da API publica

### `contracts`

- leitura apenas pelos participantes da contratacao
- criacao pelo Bar via `public.select_opportunity_candidate_for_contract(uuid)`
- confirmacao pelo Musico via `public.confirm_opportunity_contract(uuid)`
- sem `insert/update` direto pela API publica para o fluxo principal

### `opportunity_chat_threads`

- leitura apenas pelos dois participantes da candidatura
- criacao automatica via trigger no insert de `opportunity_applications`
- sem insert direto pela API publica

### `opportunity_chat_messages`

- leitura apenas pelos participantes da thread
- insert apenas pelo usuario autenticado que participa da thread
- cada mensagem atualiza o `updated_at` da thread associada

### `venue_reviews`

- leitura por usuarios autenticados
- insert, update e delete apenas pelo proprio `author_artist_id`

### `artist_reviews`

- leitura por usuarios autenticados
- insert, update e delete apenas pelo proprio `author_venue_id`

### `storage.objects` no bucket `profile-media`

- leitura publica das imagens do bucket
- upload, update e delete restritos a arquivos cujo primeiro diretorio e o `user.id` autenticado

## Observacoes de escopo

- agora inclui a entidade `opportunities` para publicacao inicial de vagas pelo Bar
- em `opportunities`, a duracao agora e persistida em horas, a recorrencia semanal usa chaves de dia em `recurrence_days` e os estilos musicais aceitam selecao multipla em `music_genres`
- agora inclui a entidade `opportunity_applications` para candidatura do Musico e convite direto do Bar
- `opportunity_applications` agora carrega a origem explicita em `source`, diferenciando `marketplace_apply` de `direct_invite`
- agora inclui a entidade `contracts` para formalizar selecao e confirmacao de contratacao
- agora inclui `opportunity_chat_threads` e `opportunity_chat_messages` para mensageria contextual por candidatura
- agora inclui a entidade `venue_reviews` para reputacao publica do estabelecimento no detalhe da vaga
- agora inclui a entidade `artist_reviews` para reputacao publica do Musico no detalhe da candidatura
- a agenda simples agora le `contracts` para listar show pendente ou confirmado com atalhos para detalhe e conversa
- agora inclui o fluxo real de avaliacao bilateral pos-evento para `contracts` concluidos
- agora inclui upload nativo de imagens com Supabase Storage no bucket publico `profile-media`
- ainda nao inclui dados privados separados dos perfis publicos
- os perfis nascem com dados minimos e serao completados pelas proximas telas
- no perfil do musico, `cidade` e `UF` passam a ser derivados do `CEP` informado no app via integracao com o ViaCEP
- no perfil do bar, `logradouro`, `bairro`, `cidade` e `UF` passam a ser derivados do `CEP` informado no app via integracao com o ViaCEP; apenas `numero` e `complemento` permanecem editaveis
- a camada atual de geolocalizacao do MVP resolve coordenadas em runtime a partir de `postal_code`, sem persistir latitude/longitude no banco nesta fase
- no perfil do bar, as fotos do ambiente vivem em `venue_media_assets` e a primeira imagem sincroniza `cover_image_url`
- no perfil do musico, videos continuam por link publico externo; o campo persistido atual segue `youtube_url` por compatibilidade, mas a UI aceita o conceito de link publico de video
