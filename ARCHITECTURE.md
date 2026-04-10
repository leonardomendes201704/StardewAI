# TocaAI - Arquitetura Tecnica

Ultima atualizacao: 2026-04-09
Status: baseline tecnica inicial

## Objetivo

Definir a arquitetura tecnica inicial do TocaAI para acelerar a implementacao do MVP mobile Android-first com o menor custo de complexidade possivel.

## Resumo das decisoes

- Frontend mobile: Expo + React Native + TypeScript
- Navegacao: Expo Router
- Plataforma inicial: Android
- Backend recomendado: Supabase
- Banco de dados: PostgreSQL gerenciado via Supabase
- Autenticacao MVP: email, senha e recuperacao por deep link nativo
- Storage MVP: imagens em storage proprio e videos por link externo
- Realtime MVP: Supabase Realtime para chat e atualizacao de status
- Observabilidade MVP: eventos e erros persistidos no Supabase, com captura global no client
- Pagamento P1: fundacao Stripe Checkout + webhook da plataforma em Edge Functions; contas conectadas e repasse ficam para a etapa seguinte
- Push notifications P1: fundacao mobile + Supabase Edge Function + preferencias por conta

## Justificativa da stack

### Mobile

Expo com React Native e TypeScript oferece o melhor equilibrio entre velocidade de entrega, ecossistema, onboarding e possibilidade de evolucao para Android nativo quando necessario.

Motivos:

- time-to-market menor que Flutter neste ambiente atual
- ecossistema JS alinhado com o que ja esta disponivel na maquina
- suporte forte para Expo Router e iteracao rapida no MVP
- Android-first sem impedir evolucao futura para iOS

### Backend

Supabase cobre os blocos principais do MVP sem exigir backend custom completo no dia zero:

- auth
- banco relacional
- storage
- realtime
- row level security

Isso reduz o tempo de infraestrutura e permite focar na logica do marketplace.

## Estado atual da implementacao

- projeto mobile inicial criado em `mobile/`
- scaffold baseado em `Expo Router` com tabs
- shell inicial do TocaAI aplicada sobre o template base
- diretorio nativo Android gerado com `expo prebuild`
- `expo-system-ui` instalado para compatibilizar `userInterfaceStyle`
- APK debug gerado com sucesso em `mobile/android/app/build/outputs/apk/debug/app-debug.apk`

## Estrutura proposta do repositorio

```text
/
|-- BACKLOG.md
|-- TASKS.md
|-- ARCHITECTURE.md
|-- USER_FLOWS.md
|-- tasks/
|-- mobile/
|   |-- app/
|   |-- assets/
|   |-- components/
|   |-- constants/
|   |-- android/
|   `-- src/
```

## Estrutura proposta do app mobile

```text
mobile/
|-- app/                    # rotas do Expo Router
|-- src/
|   |-- features/
|   |   |-- auth/
|   |   |-- profiles/
|   |   |-- opportunities/
|   |   |-- chat/
|   |   |-- agenda/
|   |   `-- reviews/
|   |-- shared/
|   |   |-- api/
|   |   |-- components/
|   |   |-- hooks/
|   |   |-- theme/
|   |   `-- utils/
|   `-- state/
```

## Camadas da aplicacao

### 1. Presentation

- telas e rotas em `app/`
- componentes de layout e design system
- formularios, listagens, estados vazios e feedback visual

### 2. Feature modules

- regras de interface e composicao por dominio
- cada feature deve encapsular tipos, hooks, services e componentes

### 3. Data access

- cliente Supabase
- queries e mutations
- adaptadores para converter payloads de banco em modelos da app

### 4. State

Uso recomendado:

- estado remoto: TanStack Query
- estado local e sessao de UI: Zustand

Observacao:
essa camada ja foi implementada na base atual com `TanStack Query`, `Zustand` persistido e `Supabase Auth` no cliente Expo.

### 5. Observabilidade

- `telemetry_events` para eventos de funil e navegacao autenticada
- `app_error_events` para falhas criticas de runtime e camada de dados
- captura global no client via `ErrorUtils`, `QueryCache` e `MutationCache`
- views SQL para leitura executiva do funil e dos erros do MVP

## Modulos funcionais do MVP

### Auth

- cadastro
- login
- recuperacao de acesso por email
- sessao persistente
- escolha de tipo de conta

### Profiles

- perfil de bar
- perfil de musico
- portfolio
- preferencias e regiao de atuacao

### Opportunities

- criar vaga
- listar vagas
- aplicar filtros
- candidatura
- convites diretos a partir da busca e do perfil publico do Musico

### Chat

- conversa contextual por vaga ou contratacao
- historico persistente

### Agenda

- eventos pendentes, confirmados, concluidos e cancelados
- bloqueio de datas do musico

### Reviews

- avaliacao bilateral
- nota media e historico
- reputacao dedicada e selos basicos nos perfis de Bar e Musico

### Payments

- Stripe Checkout hospedado para o Bar
- webhook da plataforma como fonte de verdade financeira
- modelagem por ocorrencia para eventos unicos e recorrentes
- retencao na plataforma antes de qualquer repasse
- onboarding de conta conectada do Musico com `Accounts v2`
- tentativa de repasse automatico apos show concluido
- webhook de contas conectadas e automacao `T-48h` ainda ficam para a trilha seguinte

## Modelo de dados inicial

Estado atual:

- o modelo deixou de ser apenas conceitual e agora possui baseline aplicada no Supabase
- detalhes da estrutura viva estao documentados em `DATA_MODEL.md`
- o baseline atual agora inclui `venue_media_assets`, `artist_media_assets`, bucket `profile-media` e `repertoire_summary` no perfil do musico
- o baseline aplicado agora tambem inclui `opportunities`, com publicacao pelo Bar, leitura inicial na home do Musico, duracao em horas e recorrencia semanal por dia da semana
- a partir desta sessao, o baseline tambem inclui `opportunity_applications` para candidatura do Musico e convite direto do Bar, agora com `source` explicito para diferenciar `marketplace_apply` de `direct_invite`
- a partir desta sessao, o baseline tambem inclui `opportunity_chat_threads` e `opportunity_chat_messages` para conversa contextual por candidatura
- a partir desta sessao, o baseline tambem inclui `venue_reviews` para reputacao publica do Bar no detalhe da vaga
- a partir desta sessao, o baseline tambem inclui `artist_reviews` para reputacao publica do Musico no detalhe da candidatura
- a partir desta sessao, o baseline tambem inclui `contracts` para selecao do candidato pelo Bar e confirmacao pelo Musico
- a partir desta sessao, o baseline tambem inclui cancelamento com motivo e remarcacao com historico em `contract_schedule_changes`
- as agendas de Bar e Musico deixaram de ser placeholder e passaram a listar contratacoes pendentes/confirmadas com atalhos para detalhe e conversa
- a partir desta sessao, o baseline tambem inclui `telemetry_events` e `app_error_events`, com views SQL de rollup para leitura basica de funil e erros do MVP
- a partir desta sessao, o baseline tambem inclui `account_payment_profiles` e `contract_payment_occurrences`, com Edge Functions para Checkout, webhook da plataforma, onboarding Stripe do Musico e tentativa de repasse

### Entidades principais

| Entidade | Finalidade |
| --- | --- |
| `users` | identidade base autenticada |
| `accounts` | define se a conta e `bar` ou `musico` |
| `venue_profiles` | dados do estabelecimento |
| `artist_profiles` | dados artistico-comerciais do musico |
| `artist_media` | fotos, links de video e portfolio |
| `genres` | catalogo de estilos musicais |
| `artist_genres` | relacao N:N entre artista e estilos |
| `opportunities` | vagas publicadas pelo bar |
| `opportunity_applications` | candidaturas dos musicos e convites diretos do bar, com origem explicita em `source` |
| `opportunity_chat_threads` | canal contextual por candidatura |
| `opportunity_chat_messages` | mensagens persistidas da conversa |
| `venue_reviews` | score e comentarios publicos sobre a experiencia de tocar na casa |
| `artist_reviews` | score e comentarios publicos sobre a experiencia de contratar o musico |
| `contracts` | contratacoes confirmadas |
| `account_payment_profiles` | identidade financeira do Bar e conta conectada do Musico na Stripe |
| `contract_payment_occurrences` | cobrancas por ocorrencia com retencao e rastreio Stripe |
| `contract_schedule_changes` | trilha operacional de remarcacao |
| `availability_blocks` | indisponibilidades e datas ocupadas |
| `reviews` | avaliacao bilateral apos evento sobre `venue_reviews` e `artist_reviews` |
| `telemetry_events` | eventos do funil, navegacao e operacao do MVP |
| `app_error_events` | falhas criticas de runtime, query e mutation |

### Status recomendados

| Dominio | Status |
| --- | --- |
| oportunidade | `draft`, `open`, `closed`, `cancelled` |
| candidatura | `invited`, `submitted`, `shortlisted`, `rejected`, `accepted`, `declined`, `withdrawn` |
| contratacao | `pending_confirmation`, `confirmed`, `completed`, `cancelled` |
| avaliacao | `pending`, `submitted` |

Origem de candidatura:

- `marketplace_apply` para candidatura iniciada pelo Musico no feed
- `direct_invite` para convite iniciado pelo Bar a partir da busca/perfil publico

## Estrategia de autenticacao

Para o MVP:

- login com email e senha
- recuperacao de senha com deep link nativo
- sessao persistida localmente
- escolha do tipo de conta logo apos cadastro

Motivo:

- implementacao mais simples que phone auth no inicio
- menor dependencia de deep link e OTP por SMS
- reduz variaveis na primeira validacao

## Estrategia de media

### Imagens

- upload direto para storage
- compressao e limite de tamanho no client

Estado atual:

- upload nativo implementado com `expo-image-picker`
- bucket publico `profile-media` criado no Supabase
- metadados das imagens persistidos em `venue_media_assets` e `artist_media_assets`
- no perfil do Bar, a primeira imagem sincroniza `cover_image_url`

### Videos

Para o MVP, a recomendacao e usar links externos em vez de upload bruto.

Motivos:

- custo operacional menor
- menos risco de performance
- simplifica moderacao e transcoding

Fontes aceitas inicialmente:

- YouTube
- Instagram
- TikTok

## Estrategia de chat

Chat contextual com uma sala por candidatura, evoluindo depois para contratacao confirmada quando necessario.

Requisitos minimos:

- somente envolvidos podem acessar a conversa
- mensagens ordenadas por horario
- persistencia e historico completo
- suporte a texto no MVP

Estado atual:

- o backend agora materializa `1` thread por candidatura em `opportunity_chat_threads`
- as mensagens vivem em `opportunity_chat_messages`
- a inbox compartilhada esta em `/chat`
- o detalhe contextual esta em `/chat/application/[applicationId]`
- o refresh atual usa polling curto via `TanStack Query`; `Supabase Realtime` continua como evolucao para reduzir latencia
- quando existe `contract`, a conversa passa a refletir esse contexto no header e nos atalhos do app
- o mesmo backbone de thread tambem cobre convites diretos, reaproveitando `applicationId` como contexto de convite/negociacao

## Seguranca e permissao

Regras basicas esperadas:

- Bar so pode editar vagas que criou
- Musico so pode editar o proprio perfil
- candidatura so pode ser feita por musicos
- convite direto parte apenas do Bar dono da vaga, e o aceite ou recusa final parte apenas do Musico convidado
- a origem da candidatura/convite passa a ser persistida explicitamente em `opportunity_applications.source`, reduzindo dependencia de inferencia por estado temporal
- selecao de contratacao parte do Bar dono da vaga e a confirmacao final parte apenas do Musico selecionado
- cancelamento e remarcacao de contrato partem apenas de participantes da propria contratacao e passam por RPCs seguras
- avaliacao so pode ocorrer apos evento concluido
- leitura de chat restrita aos participantes
- avaliacao real vinculada apenas a `contracts` concluidos

## Ambientes e configuracao

Variaveis previstas para `mobile/.env`:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_APP_ENV`
- `EXPO_PUBLIC_EXPO_PROJECT_ID`

Estado atual:

- `mobile/.env.example` documenta o contrato esperado
- `mobile/.env.local` foi preparado para a instancia Supabase atual
- o cliente mobile aceita `EXPO_PUBLIC_SUPABASE_ANON_KEY` apenas como fallback para compatibilidade
- o projeto Supabase ja possui migrations aplicadas para `accounts`, `venue_profiles`, `artist_profiles`, `genres`, `artist_genres`, `venue_media_assets` e `artist_media_assets`
- a fundacao atual tambem inclui `opportunities`, com RLS para leitura de vagas abertas e operacao restrita ao proprio Bar
- o modulo de vagas agora trabalha com estilos musicais selecionados por chips em `music_genres`, `duration_hours` e `recurrence_days` no payload publicado pelo app
- a camada de marketplace passa a incluir rota dedicada de detalhe para o Musico e tabela `opportunity_applications` para rastrear candidaturas e convites diretos
- a camada de operacao agora inclui inbox de chat em `/chat` e conversa contextual por candidatura em `/chat/application/[applicationId]`
- a camada de marketplace agora tambem le `venue_reviews` no detalhe da vaga para exibir score, media e comentarios do Bar
- a camada de marketplace agora tambem inclui lista de candidatos do Bar e detalhe do Musico, lendo `artist_reviews` para exibir score, media e comentarios do candidato
- a camada operacional agora tambem inclui `contracts`, RPCs de selecao/confirmacao e agendas simples conectadas a esse estado
- a busca do Bar agora tambem consegue abrir o perfil publico do Musico e disparar convite direto para uma vaga existente ou para um fluxo guiado de criacao de vaga
- a camada de reputacao agora tambem inclui fluxo real de pos-evento, com telas dedicadas para Bar e Musico avaliarem contratos concluidos usando pontualidade, qualidade e profissionalismo
- os perfis autenticados de Bar e Musico agora agregam reputacao propria com media, distribuicao, comentarios recentes e selos basicos de confianca derivados de dados objetivos do app
- as superficies publicas de perfil no marketplace tambem passam a expor sinais minimos de confianca, reaproveitando dados publicos do perfil, portfolio e reviews para reduzir incerteza sem depender de verificacao documental
- a camada de notificacoes push agora inclui `account_notification_preferences`, `account_push_registrations` e `push_notification_deliveries`, alem de `PushNotificationsProvider` no app e da Edge Function `marketplace-push-dispatch` para application, invite, chat e contract confirmation
- o runtime mobile de push agora depende de permissao do dispositivo e de `EXPO_PUBLIC_EXPO_PROJECT_ID`/credenciais Expo compatíveis para token real; quando isso nao estiver pronto, o app expõe erro explicito sem quebrar o fluxo principal

## Build e release

### Objetivo de curto prazo

- rodar app localmente no simulador ou device Android
- gerar build debug do Android

### Estado em 2026-04-07

- scaffold e prebuild concluidos
- TypeScript validado com `npx tsc --noEmit`
- o ambiente possui `JAVA_HOME` funcional via Android Studio JBR
- os env vars globais de Android apontavam para um SDK antigo, entao foi criado `mobile/android/local.properties` para fixar o SDK correto
- `react-native-worklets` exige `newArchEnabled=true`
- para acelerar a homologacao, o build foi reduzido para a ABI `arm64-v8a`
- `assembleDebug` concluiu com sucesso e emitiu o APK debug

### Passos necessarios no ambiente

1. manter `mobile/android/local.properties` apontando para o SDK valido da maquina
2. para novo build local, executar `assembleDebug` em `mobile/android`
3. se for necessario homologar em emulador x86_64, ampliar `reactNativeArchitectures`

## Decisoes ja tomadas

- Android primeiro
- Expo em vez de Flutter
- Supabase em vez de backend custom no dia zero
- videos via link externo no MVP
- shell inicial com `Expo Router` e tabs `Bar` e `Musico`
- build de homologacao Android otimizado para `arm64-v8a`

## Decisoes pendentes

- estrategia final de identidade visual
- package id definitivo Android
- politica de cancelamento e disputa
- provider de pagamentos na fase 2
- credenciais finais Expo/FCM para push em producao
- necessidade de painel web administrativo
