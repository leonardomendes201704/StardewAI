# TocaAI - Product Backlog

Ultima atualizacao: 2026-04-09
Status do documento: base inicial para discovery, planejamento e execucao

## Objetivo deste documento

Este backlog foi criado para funcionar como a fonte de verdade inicial do projeto TocaAI em futuras sessoes de chat. Ele consolida:

- contexto de produto
- escopo do MVP
- backlog priorizado
- roadmap por fases
- sequencia sugerida de execucao
- decisoes pendentes e riscos

## Resumo do produto

TocaAI e um app mobile marketplace que conecta bares, restaurantes, pubs, hoteis, eventos e casas de pequeno porte a musicos, duplas, bandas e DJs para contratacao musical sob demanda.

O produto resolve dois problemas centrais:

- estabelecimentos encontram dificuldade para contratar artistas confiaveis com rapidez
- musicos tem baixa previsibilidade de agenda, pouca visibilidade e negociacao desorganizada

O objetivo do produto e centralizar descoberta, candidatura, contratacao, agenda, alinhamento operacional e reputacao em um unico app.

## Publico-alvo

### Lado A - Contratantes

- bares
- restaurantes
- pubs
- quiosques
- pousadas e hoteis
- pequenas casas de show
- eventos corporativos
- festas particulares

### Lado B - Profissionais

- musicos solo
- voz e violao
- duplas
- bandas
- DJs
- instrumentistas

## Proposta de valor

### Para o bar

- contratar musica ao vivo com rapidez
- buscar artistas por regiao, estilo e orcamento
- reduzir faltas e desencontros com confirmacao e agenda
- concentrar comunicacao e historico em um unico canal
- aumentar seguranca com reputacao e historico

### Para o musico

- receber novas oportunidades de trabalho
- manter um perfil profissional com portfolio
- organizar agenda e disponibilidade
- negociar de forma mais padronizada
- reduzir risco de calote e cancelamento desorganizado

## Fluxos criticos do produto

1. Usuario escolhe tipo de conta: Bar ou Musico
2. Usuario conclui cadastro e perfil
3. Bar publica oportunidade ou busca artistas
4. Musico encontra oportunidade e se candidata
5. Bar analisa perfil, videos, cache e reputacao
6. As partes conversam via chat interno
7. Contratacao e confirmacao sao registradas no app
8. Evento entra na agenda dos envolvidos
9. Pos-evento, ambos se avaliam

## Escopo do MVP

O MVP deve entregar o fluxo minimo para validar contratacao musical local sem depender de pagamentos integrados ou IA.

### Dentro do MVP

- cadastro e login
- escolha de perfil Bar ou Musico
- perfil do bar
- perfil artistico do musico
- upload de fotos e videos
- publicacao de vaga/evento
- listagem de oportunidades para musicos
- candidatura do musico
- visualizacao de perfil e detalhes da vaga
- chat interno
- confirmacao da contratacao
- agenda simples
- avaliacao bilateral pos-evento

### Fora do MVP

- pagamento integrado
- notificacoes push
- geolocalizacao automatica com mapa
- contratacao recorrente
- assinaturas premium
- analytics
- IA de recomendacao
- sistema de substituicao emergencial

## Premissas atuais

- O primeiro alvo e Android com entrega em APK.
- O produto sera um marketplace de dois lados: contratante e artista.
- O lancamento inicial deve focar em mercado local/regional.
- A jornada principal do MVP sera "publicar vaga -> candidatar -> conversar -> contratar -> avaliar".
- O fluxo "bar busca e convida diretamente" pode entrar no MVP se nao comprometer prazo; caso contrario vai para a fase seguinte.
- A pasta `Prototipo/` passa a ser a referencia principal de identidade visual, hierarquia e navegacao para as proximas implementacoes de UI.
- Quando houver conflito entre o scaffold atual e os prototipos em `Prototipo/`, o prototipo prevalece.

## Metricas iniciais de validacao

- quantidade de bares cadastrados
- quantidade de musicos com perfil completo
- quantidade de vagas publicadas por semana
- taxa de candidatura por vaga
- taxa de conversao de candidatura para contratacao
- taxa de comparecimento ao evento
- nota media de reputacao de ambos os lados

## Macro-epicos

- EP01 - Discovery, requisitos e estrategia
- EP02 - Fundacao tecnica do app mobile
- EP03 - Autenticacao e onboarding
- EP04 - Perfis e portfolio
- EP05 - Marketplace de oportunidades
- EP06 - Contratacao, agenda e operacao
- EP07 - Reputacao e confianca
- EP08 - Pagamentos, notificacoes e crescimento
- EP09 - IA, analytics e expansao

## Backlog priorizado

Legenda:

- Prioridade P0: bloqueante para MVP
- Prioridade P1: importante, mas pode entrar apos o fluxo principal
- Prioridade P2: evolucao pos-MVP
- Status default: TODO se nao houver linha explicita de status

### EP01 - Discovery, requisitos e estrategia

#### BKL-001 [P0] Consolidar visao do produto e regras de negocio

Status: DONE
Atualizado em: 2026-04-08
Evidencias: `BACKLOG.md`, `USER_FLOWS.md`, `MARKETPLACE_RULES.md`, `TASK-003`, `TASK-106`

Descricao:
Transformar a proposta comercial em requisitos funcionais e nao funcionais objetivos.

Criterios de aceite:

- documento com personas, jornadas e regras principais validado
- escopo do MVP e fora do MVP claramente separados
- regras de comissao, cancelamento e reputacao identificadas

Observacao:
A consolidacao funcional foi fechada com `MARKETPLACE_RULES.md`, que agora identifica regras de oportunidade, candidatura, convite, contratacao, agenda, cancelamento, remarcacao, reputacao e direcao de comissao/pagamento para o MVP. O detalhamento fino dessas politicas tambem foi fechado em `MARKETPLACE_POLICIES.md`, deixando apenas pendencias juridico-comerciais explicitamente marcadas para fases futuras.

#### BKL-002 [P0] Mapear prototipos MVC para telas e navegacao real

Status: DONE
Atualizado em: 2026-04-08
Evidencias: `USER_FLOWS.md`, `Prototipo/`, `UI_MAP.md`, `TASK-003`, `TASK-013`, `TASK-106`

Descricao:
Relacionar cada prototipo a uma tela, estado e fluxo de navegacao no app.

Criterios de aceite:

- lista de telas do MVP fechada
- estados vazios, loading e erro mapeados
- fluxos Bar e Musico conectados ao mapa de navegacao

Observacao:
Os prototipos continuam como fonte visual principal, mas o `UI_MAP.md` agora tambem cobre as telas derivadas do MVP que nao tinham prototipo explicito, incluindo auth por email, editor de vaga, busca ativa, detalhe da vaga, candidatos, reviews e rotas de agenda/chat, com estados transversais e mapa de navegacao real.

#### BKL-003 [P0] Definir stack tecnica do produto

Status: DONE
Atualizado em: 2026-04-07
Evidencias: `ARCHITECTURE.md`, `TASK-002`

Descricao:
Escolher stack do app mobile, backend, banco, auth, storage e chat.

Criterios de aceite:

- decisao registrada para frontend mobile
- decisao registrada para backend e banco
- estrategia de upload de fotos e videos definida
- tradeoffs documentados

#### BKL-004 [P1] Definir politicas operacionais do marketplace

Status: DONE
Atualizado em: 2026-04-08
Evidencias: `MARKETPLACE_RULES.md`, `MARKETPLACE_POLICIES.md`, `USER_FLOWS.md`, `TASK-109`

Descricao:
Detalhar regras de cancelamento, no-show, disputa, moderacao e avaliacao.

Criterios de aceite:

- politicas minimas definidas
- responsabilidades de cada lado documentadas
- itens que dependem de juridico ou operacao marcados como pendentes

Observacao:
O baseline operacional foi consolidado em dois niveis. `MARKETPLACE_RULES.md` permanece como fonte de regras centrais do MVP, enquanto `MARKETPLACE_POLICIES.md` detalha cancelamento, remarcacao, no-show, disputa, moderacao de reviews, sinais basicos de confianca e responsabilidades operacionais de Bar e Musico. Os itens juridico-financeiros que ainda dependem de decisao externa continuam explicitamente marcados como pendentes, encerrando o item.

#### BKL-040 [P1] Criar painel local de backlog e tasks para acompanhamento do P.O.

Status: DONE
Atualizado em: 2026-04-08
Evidencias: `backlog-viewer/`, `start-backlog-viewer.bat`, `TASK-095`, `TASK-096`

Descricao:
Disponibilizar uma visao local, simples e legivel do backlog priorizado e do registro de tasks para acompanhamento executivo do produto.

Criterios de aceite:

- pagina local lista itens de backlog com prioridade, status e epic
- pagina mostra tasks relacionadas e seus status por item de backlog
- servidor local le `BACKLOG.md` e `TASKS.md` sem depender de build do app mobile

Observacao:
Foi criado um viewer local em `backlog-viewer/` com servidor Node sem dependencias externas, endpoint JSON e interface HTML/JS com metricas, filtros e cross-reference entre backlog e tasks para uso do P.O. Em seguida, foi adicionado um launcher `start-backlog-viewer.bat` na raiz do projeto para abrir o viewer em terminal visivel, permitindo que a execucao seja encerrada manualmente pelo usuario.

#### BKL-041 [P1] Publicar landing institucional do TocaAI em dominio proprio

Status: DONE
Atualizado em: 2026-04-09
Evidencias: `landing/`, `TASK-128`

Descricao:
Disponibilizar uma landing page institucional estatica do TocaAI em producao para apresentar a proposta de valor do produto e concentrar os CTAs de download.

Criterios de aceite:

- landing estatica publicada na VPS com `nginx`
- dominio `tocaai.devcraftstudio.com.br` respondendo em HTTPS
- `www.tocaai.devcraftstudio.com.br` redirecionando para o host canonico
- renovacao automatica do certificado configurada no servidor

Observacao:
A landing foi publicada em `/var/www/tocaai.devcraftstudio.com.br/current`, servida pelo `nginx` no host `tocaai.devcraftstudio.com.br` com certificado Let's Encrypt valido ate `2026-07-08`. O host `www.tocaai.devcraftstudio.com.br` foi configurado com redirecionamento `301` para o dominio principal e a renovacao automatica foi garantida com `certbot renew --dry-run` validado e cron em `/etc/cron.d/certbot-renew-tocaai`.

### EP02 - Fundacao tecnica do app mobile

#### BKL-005 [P0] Inicializar o projeto mobile

Status: DONE
Atualizado em: 2026-04-08
Evidencias: `mobile/`, `ARCHITECTURE.md`, `AGENTS.md`, `TASK-004`, `TASK-005`, `TASK-008`, `TASK-009`, `TASK-010`, `TASK-011`, `TASK-015`, `TASK-018`, `TASK-020`, `TASK-023`, `TASK-025`, `TASK-027`, `TASK-029`, `TASK-031`, `TASK-033`, `TASK-034`, `TASK-035`, `TASK-036`, `TASK-037`, `TASK-038`, `TASK-039`, `TASK-040`, `TASK-042`, `TASK-044`, `TASK-046`, `TASK-051`, `TASK-054`, `TASK-056`, `TASK-072`, `TASK-077`, `TASK-079`, `TASK-082`, `TASK-108`, `TASK-110`, `TASK-113`, `TASK-116`

Descricao:
Criar a base do app, estrutura de pastas, configuracoes de ambiente e build local de APK.

Criterios de aceite:

- projeto roda localmente
- build debug de APK e gerada com sucesso
- estrutura inicial de modulos definida

Observacao:
O scaffold Expo foi criado, o prebuild Android foi gerado, a estrutura inicial de modulos foi reservada, o APK debug foi emitido com sucesso em `mobile/android/app/build/outputs/apk/debug/app-debug.apk`, a instalacao via ADB Wi-Fi foi homologada em um dispositivo Android ARM64, uma build `release` standalone foi validada para testes sem Metro e o playbook operacional de instalacao em device foi registrado em `AGENTS.md`. Nesta sessao, a build `release` atual do shell alinhado ao prototipo foi regenerada e publicada com sucesso no device `192.168.0.98:41807`, sem indicio de dependencia de Metro em `localhost:8081`; depois da trilha de cadastro persistido e schema inicial do Supabase, uma nova `release` foi publicada no mesmo device com a camada de auth e materializacao de perfis base pronta para validacao funcional. A release mais recente tambem inclui o callback nativo `tocaai://auth/callback`, os formularios editaveis de perfil de Bar e Musico, a correcao do CTA fixo de salvamento no perfil do Musico, o ajuste da bottom nav para respeitar o safe area inferior e os botoes virtuais do Android, a localizacao da barra inferior para PT-BR com item ativo em verde neon, o novo fluxo de CEP mascarado com resolucao via ViaCEP no perfil do Musico, a consolidacao da marca `TocaAI` nas exibicoes, a nova splash com loading fake de `2` segundos, a simplificacao da sequencia de abertura, a remocao da tela textual intermediaria de auth, a troca dos carregamentos full-screen de perfil por scaffolds silenciosos, a fundacao de upload nativo de midia para Bar e Musico com `expo-image-picker`, portfolio visual do artista e persistencia em Supabase Storage, a fundacao inicial de vagas reais do marketplace com schema `opportunities`, editor do Bar e feed aberto do Musico, a evolucao desse modulo com recorrencia semanal por dia da semana, duracao em horas e selecao de estilo por chips, a correcao do fluxo de edicao de vagas com suporte a estilos multiplos em `music_genres`, a inbox de chat contextual por candidatura com thread persistida no Supabase e agora tambem a fundacao de `contracts` com selecao de candidato, confirmacao de contratacao e agendas simples conectadas ao backend, sem regressao de bootstrap standalone. A publicacao mais recente em `192.168.0.98:41099` tambem ja leva os sinais minimos de confianca para as superficies publicas do marketplace, com bootstrap `release` confirmado por `dumpsys` e `logcat`. A configuracao atual prioriza homologacao em Android ARM64.

#### BKL-006 [P0] Configurar navegacao, shell do app e design tokens

Status: DONE
Atualizado em: 2026-04-07
Evidencias: `mobile/app/index.tsx`, `mobile/app/bar/home.tsx`, `mobile/app/musician/home.tsx`, `mobile/app/musician/agenda.tsx`, `mobile/app/musician/profile.tsx`, `mobile/app/bar/profile.tsx`, `mobile/src/shared/theme`, `mobile/src/shared/components`, `Prototipo/`, `UI_MAP.md`, `TASK-007`, `TASK-013`, `TASK-014`, `TASK-028`, `TASK-029`, `TASK-033`, `TASK-034`, `TASK-035`, `TASK-036`, `TASK-039`, `TASK-040`

Descricao:
Criar shell inicial com navegacao, tema base, componentes primarios e estrutura de telas.

Criterios de aceite:

- navegacao entre telas principais funcionando
- tema base padronizado
- componentes base criados: botao, input, card, avatar, badge, empty state

Observacao:
O scaffold inicial baseado em tabs foi substituido por um shell alinhado ao prototipo, com onboarding, home do Bar, home do Musico, agenda, perfil e navegacao base seguindo a direcao `electric_nightfall`. Os componentes compartilhados da fundacao agora existem em `mobile/src/shared/components`, incluindo botao, input, card, avatar, badge e empty state. A bottom nav compartilhada tambem foi refinada para usar labels em PT-BR, alinhamento visual mais consistente entre icones e textos e destaque neon no item ativo. Nesta sessao, a marca visual foi consolidada como `TocaAI` nas exibicoes, o boot passou a usar uma splash propria com barra de loading fake de `2` segundos sobre a arte fornecida pelo usuario, o onboarding foi ajustado para entrar como tela funcional, a hidratacao de sessao deixou de renderizar uma tela textual separada apos a splash e os estados de carregamento dos perfis passaram a usar scaffolds silenciosos da propria tela em vez de `LoadingScreen` full-screen com a marca centralizada.

#### BKL-007 [P0] Configurar gerenciamento de estado e camada de dados

Status: DONE
Atualizado em: 2026-04-07
Evidencias: `mobile/src/shared/api/query-client.ts`, `mobile/src/shared/api/supabase/client.ts`, `mobile/src/features/session/session-store.ts`, `mobile/src/features/auth/auth-provider.tsx`, `TASK-016`

Descricao:
Definir padrao para consumo de API, cache local, sessao e estado global.

Criterios de aceite:

- padrao unico documentado e implementado
- tratamento de loading e erro previsto
- persistencia de sessao funcionando

Observacao:
A fundacao tecnica agora usa `TanStack Query` para estado remoto, `Zustand` para sessao de UI e `Supabase Auth` com persistencia local no cliente Expo. O bootstrap do app passou a respeitar hidratacao de store, sessao autenticada e redirecionamento por tipo de conta.

#### BKL-008 [P1] Configurar observabilidade e telemetria basica

Status: DONE
Atualizado em: 2026-04-09
Evidencias: `OBSERVABILITY.md`, `mobile/src/features/observability/`, `supabase/migrations/20260409_021_observability_telemetry_foundation.sql`, `supabase/migrations/20260409_022_observability_ingest_rpcs.sql`, `TASK-126`, `TASK-127`, `TASK-129`, `TASK-130`, `TASK-131`

Descricao:
Preparar logs, captura de erros e eventos principais do funil.

Criterios de aceite:

- erros criticos capturados
- eventos basicos definidos
- ambiente pronto para analise do MVP

Observacao:
A fundacao foi concluida em runtime e no Supabase. As tabelas `public.telemetry_events` e `public.app_error_events`, as views de apoio e as RPCs autenticadas de ingestao foram confirmadas remotamente. A `release` corrigida foi publicada no device `192.168.0.98:38715` e o smoke remoto passou a registrar eventos reais no banco, com pelo menos `session_restored`, `app_session_started`, `screen_view` e `app_foregrounded` persistidos em `public.telemetry_events`.

### EP03 - Autenticacao e onboarding

#### BKL-009 [P0] Criar onboarding com escolha do tipo de conta

Status: DONE
Atualizado em: 2026-04-07
Evidencias: `mobile/app/index.tsx`, `mobile/app/auth/email.tsx`, `mobile/src/features/session/session-store.ts`, `TASK-014`, `TASK-016`

Descricao:
Permitir que o usuario escolha entre Bar e Musico antes de completar o perfil.

Criterios de aceite:

- usuario escolhe o tipo de conta na primeira jornada
- tipo de conta determina fluxo de cadastro e home
- alteracao de tipo de conta tem regra definida

Observacao:
A experiencia visual de onboarding segue o prototipo e agora persiste o tipo de conta escolhido, conectando a entrada por email ao redirecionamento correto de Bar ou Musico. A regra atual grava o papel no metadata do usuario quando necessario e o reutiliza no bootstrap da sessao.

#### BKL-010 [P0] Implementar cadastro e login

Status: DONE
Atualizado em: 2026-04-08
Evidencias: `mobile/app/auth/email.tsx`, `mobile/src/features/auth/auth-provider.tsx`, `mobile/app/bar/profile.tsx`, `mobile/app/musician/profile.tsx`, `mobile/src/features/session/use-registration-snapshot.ts`, `supabase/migrations/20260407_001_initial_identity_profiles.sql`, `TASK-016`, `TASK-017`, `TASK-019`, `TASK-020`, `TASK-021`, `TASK-032`

Descricao:
Criar autenticacao inicial com metodo simples para acelerar validacao do MVP.

Criterios de aceite:

- usuario consegue criar conta
- usuario consegue entrar e sair da conta
- sessao persiste entre aberturas do app

Observacao:
O fluxo tecnico de cadastro, login, logout e persistencia de sessao foi implementado com Supabase Auth por email e senha, e agora o projeto possui schema real para materializar `accounts` e o perfil base apos o signup. O app passou a emitir `emailRedirectTo` no signup e no reenvio, consumir o callback `tocaai://auth/callback` dentro do provider de auth e expor rota nativa para concluir a sessao a partir do email de confirmacao. A homologacao funcional do cadastro real, da confirmacao nativa, do logout, da reentrada e da restauracao de sessao ja ocorreu com sucesso em device. Em 2026-04-08, o Supabase confirmou `2` contas em `public.accounts`, ambas com `profile_completed = true` e `onboarding_completed = true`.

#### BKL-011 [P1] Implementar recuperacao de acesso

Status: DONE
Atualizado em: 2026-04-08
Evidencias: `mobile/app/auth/email.tsx`, `mobile/app/auth/recovery.tsx`, `mobile/src/features/auth/auth-provider.tsx`, `mobile/src/features/auth/auth-gate.tsx`, `mobile/src/features/session/session-store.ts`, `mobile/app/auth/callback.tsx`, `TASK-115`, `TASK-116`, `TASK-119`

Descricao:
Adicionar fluxo minimo para recuperar conta.

Criterios de aceite:

- usuario consegue solicitar recuperacao
- feedback de sucesso e erro exibido

Observacao:
A trilha agora cobre solicitacao de recuperacao por email com `resetPasswordForEmail`, deep link nativo reutilizando `auth/callback`, persistencia local do estado de `password-recovery` para evitar perda do fluxo em reinicios do app e uma tela dedicada de nova senha em `mobile/app/auth/recovery.tsx`. A release correspondente foi publicada no device `192.168.0.98:41099` e a homologacao funcional no aparelho confirmou envio do email, abertura do link no app, redefinicao da senha e novo login com sucesso, encerrando o item.

### EP04 - Perfis e portfolio

#### BKL-012 [P0] Criar perfil do estabelecimento

Status: DONE
Atualizado em: 2026-04-08
Evidencias: `DATA_MODEL.md`, `supabase/migrations/20260407_001_initial_identity_profiles.sql`, `supabase/migrations/20260408_003_venue_profiles_postal_code_address_parts.sql`, `supabase/migrations/20260408_004_profile_media_storage_foundation.sql`, `mobile/app/bar/profile.tsx`, `mobile/src/features/profiles/profile-editor.ts`, `mobile/src/features/profiles/profile-media.ts`, `TASK-017`, `TASK-022`, `TASK-023`, `TASK-032`, `TASK-041`, `TASK-042`, `TASK-043`, `TASK-044`, `TASK-045`, `TASK-046`, `TASK-047`

Descricao:
Cadastrar nome, endereco, tipo de casa, capacidade, fotos e horarios com musica ao vivo.

Criterios de aceite:

- perfil do bar pode ser criado e editado
- campos obrigatorios validados
- fotos do ambiente podem ser enviadas

Observacao:
A base de dados do perfil do estabelecimento agora existe no Supabase com `venue_profiles`, criada automaticamente no cadastro inicial quando a conta nasce como `bar`. A materializacao automatica ja foi validada com ao menos `1` perfil real criado via signup. A tela `mobile/app/bar/profile.tsx` foi convertida em formulario real conectado ao Supabase, com salvamento de nome da casa, tipo, localizacao, dias de performance, capacidade e bio, alem de sincronizar `accounts.display_name`, `profile_completed` e `onboarding_completed`. Em 2026-04-08, a homologacao funcional do preenchimento no device foi confirmada e o Supabase mostrou persistencia real em `venue_profiles`. Depois disso, o endereco do Bar passou a priorizar `CEP` obrigatorio via ViaCEP, com `logradouro`, `bairro`, `cidade` e `UF` resolvidos automaticamente e bloqueados para edicao; apenas `numero` e `complemento` permanecem editaveis, e `address_text` segue derivado internamente para compatibilidade. Nesta mesma data, o item ganhou upload nativo de fotos do ambiente via `profile-media`, persistencia em `venue_media_assets` e sincronismo automatico da capa do perfil a partir da primeira imagem enviada. Logo depois, o fluxo de upload foi estabilizado no Android release ao remover a conversao baseada em `fetch(data:...)`. A homologacao real no device foi concluida com `3` fotos persistidas em `public.venue_media_assets` e `public.venue_profiles.cover_image_url` preenchido com a primeira imagem, fechando o criterio de aceite de envio de fotos do ambiente.

#### BKL-013 [P0] Criar perfil artistico do musico

Status: DONE
Atualizado em: 2026-04-08
Evidencias: `DATA_MODEL.md`, `supabase/migrations/20260407_001_initial_identity_profiles.sql`, `supabase/migrations/20260407_002_artist_profiles_postal_code.sql`, `mobile/app/musician/profile.tsx`, `mobile/src/features/profiles/profile-editor.ts`, `TASK-017`, `TASK-022`, `TASK-023`, `TASK-024`, `TASK-025`, `TASK-026`, `TASK-027`, `TASK-030`, `TASK-031`, `TASK-032`

Descricao:
Cadastrar nome artistico, categoria, estilos, regiao de atuacao, cache medio e estrutura.

Criterios de aceite:

- perfil do musico pode ser criado e editado
- usuario seleciona categoria e estilos
- informacoes de cache e raio de atuacao sao salvas

Observacao:
A base de dados do perfil artistico agora existe no Supabase com `artist_profiles`, `genres` e `artist_genres`, incluindo seed inicial de estilos. A materializacao automatica ja foi validada com ao menos `1` perfil real criado via signup. A tela `mobile/app/musician/profile.tsx` foi convertida em formulario real conectado ao Supabase, com persistencia de nome artistico, categoria, raio de atuacao, cache medio, bio, estrutura, links publicos e selecao de generos via `artist_genres`, alem de sincronizar `accounts.display_name`, `profile_completed` e `onboarding_completed`. A localizacao do Musico passou a ser orientada por `CEP` mascarado, persistido em `artist_profiles.postal_code` e resolvido automaticamente via ViaCEP para preencher `cidade` e `UF`, que ficam bloqueados para edicao manual. Depois da primeira homologacao visual, o CTA de salvamento foi movido para uma faixa fixa acima da bottom nav, os residuos do bloco de preview do prototipo foram removidos da UI publicada no device e a barra inferior passou a respeitar o safe area inferior do Android para nao colidir com os botoes virtuais. Em 2026-04-08, a homologacao funcional do preenchimento no device foi confirmada, incluindo persistencia em `artist_profiles` e vinculo de genero em `artist_genres`.

#### BKL-014 [P0] Implementar portfolio com fotos, videos e repertorio

Status: DONE
Atualizado em: 2026-04-08
Evidencias: `DATA_MODEL.md`, `ARCHITECTURE.md`, `supabase/migrations/20260408_004_profile_media_storage_foundation.sql`, `mobile/app/musician/profile.tsx`, `mobile/src/features/profiles/profile-editor.ts`, `mobile/src/features/profiles/profile-media.ts`, `TASK-043`, `TASK-044`, `TASK-045`, `TASK-046`, `TASK-048`, `TASK-049`

Descricao:
Permitir que o musico publique midias e repertorio para avaliacao do contratante.

Criterios de aceite:

- upload de fotos funciona
- upload ou link de videos funciona
- repertorio pode ser preenchido e exibido

Observacao:
A fundacao tecnica do portfolio agora existe com bucket `profile-media`, tabela `artist_media_assets`, upload nativo com `expo-image-picker`, hero dinamico a partir da primeira foto enviada, campo persistido `repertoire_summary` e manutencao do link publico de video no perfil. Depois da primeira publicacao, o fluxo de upload foi estabilizado no Android release ao trocar a conversao da imagem para decode base64 direto em memoria. Em 2026-04-08, a homologacao real das fotos do Musico foi confirmada com `2` itens persistidos em `public.artist_media_assets`, preservando a ordem de envio. Na sequencia, a validacao funcional do portfolio foi concluida com `public.artist_profiles.youtube_url` e `public.artist_profiles.repertoire_summary` preenchidos no Supabase, fechando os criterios de aceite de fotos, video/link e repertorio.

#### BKL-015 [P1] Exibir reputacao e selos basicos no perfil

Status: DONE
Atualizado em: 2026-04-08
Evidencias: `mobile/src/features/reputation/profile-reputation.tsx`, `mobile/app/bar/profile.tsx`, `mobile/app/musician/profile.tsx`, `MARKETPLACE_POLICIES.md`, `TASK-109`, `TASK-110`

Descricao:
Mostrar nota, quantidade de avaliacoes e sinais de completude do perfil.

Criterios de aceite:

- reputacao visivel no perfil
- perfil incompleto sinalizado
- regras de selo minimo documentadas

Observacao:
Os perfis autenticados de Bar e Musico agora exibem reputacao dedicada no proprio perfil, com media, quantidade de reviews, distribuicao por estrelas e comentarios recentes. Na mesma trilha, foram expostos selos basicos derivados de dados objetivos do app, como perfil completo, base ou endereco validado por CEP, portfolio ou fotos publicadas e historico publico de reviews ou shows concluidos. As regras desses selos ficaram documentadas em `MARKETPLACE_POLICIES.md`, encerrando o item.

### EP05 - Marketplace de oportunidades

#### BKL-016 [P0] Criar tela de home do Bar com recomendacoes ou atalhos

Status: DONE
Atualizado em: 2026-04-08
Evidencias: `mobile/app/bar/home.tsx`, `mobile/src/features/opportunities/opportunities.ts`, `mobile/src/features/contracts/contracts.ts`, `mobile/src/features/search/bar-artist-search.ts`, `TASK-014`, `TASK-050`, `TASK-107`, `TASK-108`

Descricao:
Entregar a primeira area util do contratante, mesmo antes de IA sofisticada.

Criterios de aceite:

- home mostra atalhos para publicar vaga, buscar artistas e ver agenda
- estado vazio tratado quando nao houver dados

Observacao:
A home do Bar foi implementada com o shell do prototipo, incluindo hero CTA, chips de genero, destaques e feed de musicos por perto. Em 2026-04-08, a home passou a publicar vagas por CTA funcional, mostrar contadores reais de vagas por status e listar as vagas do proprio estabelecimento com acoes de editar, cancelar e reabrir. Na mesma data, os blocos estaticos foram substituidos por conexao real com `agenda` e `busca ativa`: a tela agora destaca a proxima contratacao, abre conversa e detalhe do contrato, e exibe artistas reais prontos para convite e descoberta local. Com isso, o item foi encerrado.

#### BKL-017 [P0] Criar home do Musico com oportunidades disponiveis

Status: DONE
Atualizado em: 2026-04-08
Evidencias: `mobile/app/musician/home.tsx`, `mobile/app/musician/agenda.tsx`, `mobile/app/musician/profile.tsx`, `mobile/src/features/opportunities/opportunities.ts`, `TASK-014`, `TASK-050`, `TASK-052`, `TASK-053`, `TASK-054`, `TASK-055`, `TASK-056`, `TASK-057`, `TASK-058`, `TASK-104`, `TASK-105`, `TASK-107`, `TASK-108`

Descricao:
Apresentar vagas recentes e relevantes para a regiao e estilo do artista.

Criterios de aceite:

- lista de oportunidades carregada
- cards exibem data, horario, local, estilo e cache
- usuario consegue abrir detalhes da oportunidade

Observacao:
A home do Musico foi implementada com cards de oportunidade, CTA de candidatura e rotas base para agenda e perfil no mesmo padrao visual do prototipo. Em 2026-04-08, os cards passaram a consumir oportunidades abertas reais da tabela `public.opportunities`, com budget, cidade, genero e imagem de capa do estabelecimento. Na mesma data, a homologacao funcional confirmou que uma vaga real criada pelo Bar apareceu no feed do Musico. Depois disso, o feed evoluiu para renderizar agenda recorrente por dia da semana, duracao em horas, destaque visual da recorrencia e multiplos estilos musicais por vaga. Por fim, a homologacao funcional confirmou que cancelar a vaga a remove do feed e reabrir a vaga a faz reaparecer. Nesta sessao, a home ganhou filtros reais por `periodo`, `regiao` e `faixa de cache`, ranking geografico minimo priorizando `cidade` e depois `estado`, e chips visuais de contexto geografico no proprio card. O calculo de distancia real por raio continua fora deste item e segue em `BKL-033`.

#### BKL-018 [P0] Implementar criacao de vaga/evento pelo Bar

Status: DONE
Atualizado em: 2026-04-08
Evidencias: `supabase/migrations/20260408_005_opportunities_foundation.sql`, `supabase/migrations/20260408_006_opportunities_recurrence_duration_hours.sql`, `supabase/migrations/20260408_007_opportunities_multi_genre.sql`, `mobile/src/features/opportunities/opportunities.ts`, `mobile/src/features/opportunities/opportunity-editor-screen.tsx`, `mobile/app/bar/opportunities/new.tsx`, `mobile/app/bar/opportunities/[id].tsx`, `mobile/app/bar/home.tsx`, `mobile/app/musician/home.tsx`, `TASK-050`, `TASK-052`, `TASK-053`, `TASK-054`, `TASK-055`, `TASK-056`, `TASK-057`

Descricao:
Permitir cadastrar data, horario, duracao, estilo, orcamento, local e estrutura disponivel.

Criterios de aceite:

- bar consegue criar vaga com validacoes basicas
- vaga fica disponivel para musicos compativeis
- vaga pode ser editada ou cancelada antes da contratacao

Observacao:
A fundacao tecnica da criacao de vagas foi implementada com schema persistido em `public.opportunities`, RLS, editor real no app, possibilidade de salvar rascunho ou publicar, e operacao de cancelar ou reabrir a vaga antes da contratacao. As vagas `open` ja alimentam a home do Musico. A build `release` com esse modulo ja foi publicada no device de homologacao, e o Supabase confirma a tabela `public.opportunities` ativa com RLS. Em 2026-04-08, a homologacao funcional confirmou a criacao real da vaga `Toque uma pra mim`, persistida com status `open` e visivel no feed do Musico. Na sequencia, a trilha evoluiu com migration para `duration_hours` e `recurrence_days`, editor do Bar com selecao de estilo por chips e recorrencia semanal por dia da semana, alem de labels de agenda recorrente nas homes do Bar e do Musico. Depois disso, o fluxo foi corrigido para editar vagas existentes sem corromper a data carregada e passou a aceitar selecao multipla de estilos em `music_genres`, refletida tanto no editor quanto nos cards do feed. Por fim, a homologacao funcional confirmou no device o ciclo completo de editar, cancelar e reabrir a vaga, com reflexo correto no feed do Musico e retorno do registro ao estado `open` no Supabase, fechando os criterios de aceite do item. Apos a entrada das candidaturas, surgiu uma regressao de recursao infinita entre as policies de `public.opportunities` e `public.opportunity_applications`; a `TASK-060` corrigiu isso usando helper functions `security definer` em schema `private`, restaurando a criacao de vagas e a leitura do marketplace.

#### BKL-019 [P0] Implementar listagem e detalhe de vagas para o Musico

Status: DONE
Atualizado em: 2026-04-08
Evidencias: `mobile/app/musician/home.tsx`, `mobile/app/musician/opportunities/[id].tsx`, `mobile/src/features/opportunities/opportunities.ts`, `mobile/src/features/opportunities/opportunity-detail-screen.tsx`, `supabase/migrations/20260408_011_venue_reviews_foundation.sql`, `supabase/migrations/20260408_020_apply_to_open_opportunity_rpc.sql`, `TASK-058`, `TASK-061`, `TASK-062`, `TASK-063`, `TASK-064`, `TASK-104`, `TASK-105`, `TASK-107`, `TASK-108`

Descricao:
Exibir oportunidades abertas com filtros minimos.

Criterios de aceite:

- filtro por data, regiao e faixa de cache
- detalhe da vaga mostra informacoes suficientes para candidatura
- vagas encerradas nao aceitam novas candidaturas

Observacao:
O detalhe da vaga do Musico ja existe com rota dedicada, fotos reais do Bar, viewer em tela cheia, score da casa, comentarios publicos e CTA de candidatura atrelado ao estado real da oportunidade. Nesta sessao, a listagem ganhou filtros minimos por `data`, `regiao` e `faixa de cache`, e o fluxo de candidatura espontanea foi endurecido com a RPC `public.apply_to_open_opportunity(uuid)` para reduzir bloqueios genericos de RLS. Depois disso, o feed passou a esconder oportunidades que ja nao sao mais candidataveis, como contratos `confirmed`, `completed` ou `cancelled`, encerrando o item.

#### BKL-020 [P0] Implementar candidatura do Musico

Status: DONE
Atualizado em: 2026-04-08
Evidencias: `supabase/migrations/20260408_008_opportunity_applications_foundation.sql`, `supabase/migrations/20260408_012_artist_reviews_and_bar_candidate_views.sql`, `supabase/migrations/20260408_020_apply_to_open_opportunity_rpc.sql`, `mobile/src/features/opportunities/opportunities.ts`, `mobile/src/features/opportunities/bar-candidates.ts`, `mobile/src/features/opportunities/bar-opportunity-candidates-screen.tsx`, `mobile/src/features/opportunities/bar-candidate-detail-screen.tsx`, `TASK-058`, `TASK-065`, `TASK-066`, `TASK-067`, `TASK-068`, `TASK-075`, `TASK-104`, `TASK-105`

Descricao:
Permitir que o musico demonstre interesse ou envie proposta simples.

Criterios de aceite:

- musico pode se candidatar a uma vaga
- bar visualiza lista de candidatos
- status da candidatura e rastreavel

Observacao:
A fundacao tecnica da candidatura foi implementada com a tabela `public.opportunity_applications`, RLS, mutation no app e persistencia do status por vaga e artista. O lado do Bar ganhou lista de candidatos por vaga e detalhe do Musico com score, portfolio e comentarios de outros bares, apoiado pela tabela `public.artist_reviews`. Depois disso, a lista foi refinada para remover o chip redundante de status e centralizar o CTA `Ver candidato`, enquanto o detalhe do Musico passou a abrir Instagram e video no app correspondente quando disponivel, com fallback web. Em 2026-04-08, a homologacao real do fluxo foi fechada com ao menos `1` candidatura persistida, lista de candidatos navegavel do lado do Bar e reaproveitamento dessa mesma candidatura como contexto do chat entre as partes. Depois da homologacao, a entrada do Musico foi endurecida por RPC `public.apply_to_open_opportunity`, removendo o `insert` direto para escapar de falsos bloqueios de RLS em vagas realmente `open`.

#### BKL-021 [P0] Implementar busca de artistas pelo Bar

Status: DONE
Atualizado em: 2026-04-08
Evidencias: `mobile/src/features/search/bar-artist-search.ts`, `mobile/src/features/search/bar-artist-search-screen.tsx`, `mobile/src/features/search/bar-artist-detail-screen.tsx`, `mobile/app/search.tsx`, `mobile/app/bar/artists/[artistId].tsx`, `TASK-085`, `TASK-086`, `TASK-087`

Descricao:
Permitir descoberta ativa de musicos por filtros essenciais.

Criterios de aceite:

- filtro por cidade ou regiao
- filtro por estilo musical
- filtro por categoria e faixa de cache
- abertura do perfil completo do artista

Observacao:
A fundacao funcional foi implementada com busca real para contas `Bar`, filtros por regiao, genero, categoria e faixa de cache, alem de detalhe publico do artista com portfolio, links e reputacao. A homologacao funcional real no device confirmou esse comportamento, encerrando o item.

#### BKL-022 [P1] Implementar convite direto do Bar para o Musico

Status: DONE
Atualizado em: 2026-04-08
Evidencias: `supabase/migrations/20260408_017_direct_opportunity_invites.sql`, `supabase/migrations/20260408_018_opportunity_application_source_hardening.sql`, `mobile/src/features/opportunities/bar-direct-invite-screen.tsx`, `mobile/app/bar/invite/[artistId].tsx`, `mobile/src/features/search/bar-artist-detail-screen.tsx`, `mobile/src/features/opportunities/opportunities.ts`, `mobile/src/features/opportunities/opportunity-detail-screen.tsx`, `mobile/src/features/opportunities/bar-candidate-detail-screen.tsx`, `mobile/src/features/contracts/contracts.ts`, `TASK-097`, `TASK-098`, `TASK-099`, `TASK-100`, `TASK-101`

Descricao:
Permitir que o contratante convide um artista a partir do perfil publico do Musico, sem depender de candidatura previa.

Criterios de aceite:

- bar consegue iniciar o convite pelo perfil do artista na busca
- convite pode ser associado a vaga existente ou a um fluxo guiado de criacao de vaga
- musico recebe convite na area de oportunidades ou convites
- status de aceite ou recusa e rastreavel

Observacao:
O fluxo foi homologado em uso real. O Bar parte do perfil publico do Musico na busca, escolhe uma vaga existente ou cria uma nova vaga com retorno automatico ao convite, e o Musico recebe esse contexto no feed para aceitar ou recusar. Depois da homologacao, a trilha foi endurecida com `source` explicito em `public.opportunity_applications`, eliminando a dependencia de inferencia por status ou timestamp para distinguir `marketplace_apply` de `direct_invite`. A evidência operacional no Supabase mostrou um caso recente compatível com convite direto aceito: candidatura `accepted`, contrato associado `confirmed` e oportunidade `closed` para a vaga `Toque uma pra mim`, encerrando o item com rastreabilidade mais robusta.

### EP06 - Contratacao, agenda e operacao

#### BKL-023 [P0] Implementar chat interno contextualizado por vaga

Status: DONE
Atualizado em: 2026-04-08
Evidencias: `supabase/migrations/20260408_013_opportunity_chat_foundation.sql`, `mobile/src/features/chat/chat.ts`, `mobile/src/features/chat/chat-inbox-screen.tsx`, `mobile/src/features/chat/chat-thread-screen.tsx`, `mobile/app/chat.tsx`, `mobile/app/chat/application/[applicationId].tsx`, `mobile/src/features/opportunities/opportunity-detail-screen.tsx`, `mobile/src/features/opportunities/bar-candidate-detail-screen.tsx`, `TASK-071`, `TASK-072`, `TASK-073`, `TASK-074`, `TASK-075`

Descricao:
Criar canal de comunicacao entre bar e musico para alinhamentos operacionais.

Criterios de aceite:

- chat vinculado a vaga ou contratacao
- historico de mensagens persistido
- participantes corretos isolados por contexto

Observacao:
A fundacao do chat contextual entrou sobre a candidatura ja existente, com `1` thread por `opportunity_application` materializada em `public.opportunity_chat_threads` e mensagens persistidas em `public.opportunity_chat_messages`. O app agora possui inbox compartilhada em `/chat`, detalhe por candidatura em `/chat/application/[applicationId]` e atalhos diretos a partir do detalhe da vaga do Musico, da home do Musico, do detalhe do candidato e da lista de candidatos do lado do Bar. Depois da primeira rodada de uso, a navegacao ganhou pontos de entrada mais explicitos para nao depender apenas da aba `Conversa`. Nesta fase, o refresh usa polling curto via `TanStack Query` em vez de assinatura realtime. Em 2026-04-08, a homologacao real foi concluida com `1` thread persistida e `2` mensagens reais trocadas entre Bar e Musico no Supabase.

#### BKL-024 [P0] Implementar confirmacao de contratacao

Status: DONE
Atualizado em: 2026-04-08
Evidencias: `supabase/migrations/20260408_014_contracts_foundation.sql`, `mobile/src/features/contracts/contracts.ts`, `mobile/src/features/opportunities/opportunity-detail-screen.tsx`, `mobile/src/features/opportunities/bar-candidate-detail-screen.tsx`, `mobile/src/features/chat/chat.ts`, `mobile/src/features/opportunities/opportunities.ts`, `TASK-076`, `TASK-077`, `TASK-078`, `TASK-079`, `TASK-080`

Descricao:
Registrar formalmente quando uma candidatura ou convite vira contratacao.

Criterios de aceite:

- bar consegue selecionar um candidato
- musico confirma a contratacao
- vaga muda de status de aberta para fechada

Observacao:
A fundacao da contratacao agora existe em `public.contracts`, com funcoes seguras para o Bar selecionar um candidato e para o Musico confirmar o fechamento. O app reflete esse estado na home do Musico, no detalhe da vaga, no detalhe do candidato, no chat contextual e na agenda. A transicao foi validada por smoke test transacional no Supabase com `ROLLBACK`, comprovando `contract = confirmed`, `application = accepted` e `opportunity = closed`. Depois da primeira homologacao real, foi corrigida uma regressao em que shows ja confirmados ainda permaneciam no feed de vagas do Musico; a regra passou a manter no feed apenas contratacoes `pending_confirmation`, deixando os shows confirmados apenas na agenda. O reteste funcional real no device confirmou esse comportamento, encerrando o item.

#### BKL-025 [P0] Criar agenda simples para Bar e Musico

Status: DONE
Atualizado em: 2026-04-08
Evidencias: `mobile/app/bar/agenda.tsx`, `mobile/app/musician/agenda.tsx`, `mobile/src/features/contracts/contracts.ts`, `supabase/migrations/20260408_015_contract_lifecycle_actions.sql`, `TASK-076`, `TASK-077`, `TASK-081`, `TASK-082`, `TASK-083`

Descricao:
Exibir eventos abertos, pendentes, confirmados, concluidos e cancelados.

Criterios de aceite:

- agenda lista contratacoes futuras
- datas ocupadas do musico aparecem bloqueadas
- usuario consegue abrir detalhe do evento pela agenda

Observacao:
As duas agendas deixaram de ser placeholder e agora separam `Fluxo ativo` de `Historico`, com atalhos para detalhe e conversa. O lado do Musico passou a mostrar um bloco visual de `21` dias com datas ocupadas por contratacoes pendentes ou confirmadas, e o ciclo simples de `completed/cancelled` foi liberado via novas RPCs de contrato e acoes nas telas de detalhe. A homologacao funcional real no aparelho confirmou esse comportamento, encerrando o item.

#### BKL-026 [P1] Implementar cancelamento e remarcacao basicos

Status: DONE
Atualizado em: 2026-04-08
Evidencias: `supabase/migrations/20260408_019_contract_cancellation_and_reschedule_basics.sql`, `mobile/src/features/contracts/contracts.ts`, `mobile/src/features/contracts/contract-operation-modals.tsx`, `mobile/src/features/opportunities/opportunity-detail-screen.tsx`, `mobile/src/features/opportunities/bar-candidate-detail-screen.tsx`, `MARKETPLACE_POLICIES.md`, `TASK-102`, `TASK-103`, `TASK-109`, `TASK-110`, `TASK-111`

Descricao:
Permitir cancelamento e remarcacao com status e historico.

Criterios de aceite:

- cancelamento registra motivo
- remarcacao atualiza agenda dos dois lados
- regras minimas de permissao definidas

Observacao:
A fundacao funcional foi implementada, formalizada em `MARKETPLACE_POLICIES.md` e agora tambem homologada no device. O cancelamento exige motivo, registra `cancelled_by` e move o evento para historico, enquanto a remarcacao grava trilha em `public.contract_schedule_changes`, atualiza agenda e detalhe para os dois lados e preserva o contexto operacional compartilhado. O fluxo cobre contratacao tradicional e convite direto pendente. Nesta etapa, o cancelamento continua sem reabrir a vaga automaticamente, por decisao consciente do MVP.

#### BKL-027 [P1] Adicionar lembretes operacionais in-app

Status: DONE
Atualizado em: 2026-04-08
Evidencias: `mobile/src/features/contracts/contracts.ts`, `mobile/src/features/contracts/operational-reminder-card.tsx`, `mobile/app/bar/home.tsx`, `mobile/app/musician/home.tsx`, `mobile/app/bar/agenda.tsx`, `mobile/app/musician/agenda.tsx`, `TASK-120`, `TASK-121`, `TASK-122`

Descricao:
Criar lembretes simples antes do evento, mesmo sem push.

Criterios de aceite:

- evento proximo e destacado
- usuario visualiza status de confirmacao
- checklist minimo de alinhamento previsto

Observacao:
A fundacao funcional foi implementada usando apenas dados de contratos ja existentes no app. O sistema agora deriva lembretes para `confirmacao pendente`, `show nesta semana`, `show nas proximas 48h` e `show de hoje`, com checklist operacional minimo e atalhos para detalhe e conversa. Os cards compartilhados foram conectados tanto nas homes quanto nas agendas de Bar e Musico, e a release correspondente ja foi publicada no device `192.168.0.98:41099`. A homologacao funcional no aparelho passou, encerrando o item.

### EP07 - Reputacao e confianca

#### BKL-028 [P0] Implementar avaliacao bilateral pos-evento

Status: DONE
Atualizado em: 2026-04-08
Evidencias: `supabase/migrations/20260408_016_post_event_reviews_workflow.sql`, `mobile/src/features/reviews/reviews.ts`, `mobile/src/features/reviews/contract-review-screen.tsx`, `mobile/app/musician/reviews/[contractId].tsx`, `mobile/app/bar/reviews/[contractId].tsx`, `mobile/app/musician/agenda.tsx`, `mobile/app/bar/agenda.tsx`, `mobile/src/features/opportunities/opportunity-detail-screen.tsx`, `mobile/src/features/opportunities/bar-candidate-detail-screen.tsx`, `TASK-088`, `TASK-089`, `TASK-090`, `TASK-091`, `TASK-092`, `TASK-093`, `TASK-094`

Descricao:
Bar e Musico avaliam a experiencia apos a conclusao do evento.

Criterios de aceite:

- ambos conseguem avaliar apos evento concluido
- campos principais contemplam pontualidade, qualidade e profissionalismo
- nota media e quantidade de avaliacoes sao recalculadas

Observacao:
A fundacao funcional do pos-evento foi implementada usando as tabelas de reputacao existentes, agora estendidas com score composto por pontualidade, qualidade e profissionalismo. As policies foram endurecidas para aceitar review real apenas quando existe `contract` concluido entre as partes. O app ganhou CTAs de avaliacao nos detalhes e na agenda historica dos dois lados, alem de telas dedicadas de review por contrato. Depois da primeira tentativa de uso real, o fluxo de persistencia foi ajustado para trocar `upsert` por `insert/update` explicito, reduzindo o risco com indices unicos parciais via Supabase/PostgREST. Em seguida, a UX pos-save foi refinada para esconder formulario e CTA assim que a review existe, exibindo estado final somente leitura com score composto, breakdown e comentario salvo. A homologacao real foi concluida com `1` review de Musico para o Bar e `1` review de Bar para o Musico, ambas persistidas com os tres criterios e `rating` recalculado.

#### BKL-029 [P1] Implementar historico de reputacao e comentarios

Status: DONE
Atualizado em: 2026-04-08
Evidencias: `supabase/migrations/20260408_011_venue_reviews_foundation.sql`, `supabase/migrations/20260408_012_artist_reviews_and_bar_candidate_views.sql`, `mobile/src/features/opportunities/opportunities.ts`, `mobile/src/features/opportunities/opportunity-detail-screen.tsx`, `mobile/src/features/opportunities/bar-candidates.ts`, `mobile/src/features/opportunities/bar-candidate-detail-screen.tsx`, `mobile/src/features/reputation/profile-reputation.tsx`, `mobile/app/bar/profile.tsx`, `mobile/app/musician/profile.tsx`, `MARKETPLACE_POLICIES.md`, `TASK-063`, `TASK-064`, `TASK-065`, `TASK-066`, `TASK-067`, `TASK-068`, `TASK-109`, `TASK-110`

Descricao:
Exibir avaliacoes anteriores com contexto suficiente para gerar confianca.

Criterios de aceite:

- lista de avaliacoes visivel no perfil
- comentarios moderados por regras basicas
- media e distribuicao exibidas

Observacao:
A primeira fundacao de historico de reputacao existe em `public.venue_reviews` e `public.artist_reviews`, com score e comentarios em contexto de vaga, candidatura e busca do Bar. Nesta sessao, a trilha foi expandida para perfis dedicados: Bar e Musico agora veem media, distribuicao por estrelas e comentarios recentes diretamente nas telas de perfil autenticado, sem depender apenas do contexto da oportunidade. As regras basicas de moderacao e origem confiavel dos comentarios tambem foram formalizadas em `MARKETPLACE_POLICIES.md`, encerrando o item.

#### BKL-030 [P1] Implementar mecanismos minimos de confianca

Status: DONE
Atualizado em: 2026-04-08
Evidencias: `mobile/src/features/reputation/profile-reputation.tsx`, `mobile/src/features/search/bar-artist-detail-screen.tsx`, `mobile/src/features/opportunities/opportunity-detail-screen.tsx`, `mobile/src/features/opportunities/bar-candidate-detail-screen.tsx`, `MARKETPLACE_POLICIES.md`, `TASK-112`, `TASK-113`, `TASK-114`

Descricao:
Adicionar sinais de seguranca como perfil verificado, completude e historico.

Criterios de aceite:

- indicadores visiveis no perfil
- regras de exibicao documentadas
- nao depende de validacao documental complexa no MVP

Observacao:
Os perfis autenticados ja exibem selos basicos de confianca, e nesta sessao os mesmos principios foram levados para as superficies publicas mais relevantes do marketplace: detalhe publico do Musico na busca do Bar, detalhe do candidato e detalhe da vaga para o Musico. Os sinais usam apenas dados objetivos ja publicados no proprio app, como clareza do perfil operacional, base geografica, portfolio visual e reviews publicas, sem depender de verificacao documental externa. A release correspondente foi publicada no device `192.168.0.98:41099` e a homologacao visual final passou, encerrando o item.

### EP08 - Pagamentos, notificacoes e crescimento

#### BKL-031 [P1] Integrar pagamento com sinal e saldo

Status: IN_PROGRESS
Atualizado em: 2026-04-09
Evidencias: `BACKLOG.md`, `TASK-084`, `TASK-133`, `TASK-134`, `TASK-135`, `TASK-136`, `TASK-137`, `TASK-138`, `TASK-139`, `TASK-140`, `TASK-141`, `TASK-142`, `TASK-143`, `TASK-144`, `TASK-145`, `TASK-146`, `TASK-147`, `TASK-148`, `TASK-149`, `TASK-150`, `TASK-151`, `TASK-152`, `TASK-153`, `TASK-154`, `TASK-155`, `TASK-156`, `TASK-157`, `TASK-158`, `TASK-160`, `TASK-161`, `TASK-162`, `TASK-163`, `TASK-164`, `TASK-165`, `PAYMENTS.md`, `supabase/migrations/20260409_023_stripe_platform_payment_foundation.sql`, `supabase/migrations/20260409_024_fix_payment_release_after_timezone.sql`, `supabase/migrations/20260409_025_stripe_connect_accounts_and_payout_state.sql`, `supabase/functions/stripe-create-platform-checkout/index.ts`, `supabase/functions/stripe-platform-webhook/index.ts`, `supabase/functions/stripe-connect-webhook/index.ts`, `supabase/functions/stripe-create-musician-connect-onboarding/index.ts`, `supabase/functions/stripe-sync-musician-connect-account/index.ts`, `supabase/functions/stripe-release-musician-payout/index.ts`, `mobile/src/features/payments/payments.ts`, `mobile/app/musician/profile.tsx`

Descricao:
Implementar fluxo de pagamento seguro no app.

Criterios de aceite:

- contratacao aceita pagamento de sinal
- saldo pode ser liberado apos conclusao
- comissao da plataforma calculada

Observacao:
O direcionamento atual para a camada de pagamento passa a assumir `retencao` do valor ate a conclusao do evento, com split entre repasse do Musico e taxa da plataforma. Para eventos unitarios, o fluxo pode seguir com cobranca simples ligada a uma unica contratacao. Para series recorrentes, o backlog passa a priorizar cobranca `por ocorrencia`, em vez de cobrar a serie inteira de uma vez, para reduzir risco operacional e evitar travar agenda futura sem lastro financeiro. Nesta sessao, a fundacao da plataforma foi criada com `Stripe Checkout`, webhook de `Sua conta`, `account_payment_profiles` e `contract_payment_occurrences`, deixando a URL real do webhook publicada no Supabase. Os secrets minimos da Stripe ja foram cadastrados manualmente no projeto, e um smoke no endpoint publico retornou erro real de assinatura invalida da Stripe, confirmando que o runtime da Edge Function ja esta lendo `STRIPE_SECRET_KEY` e `STRIPE_PLATFORM_WEBHOOK_SECRET`. A superficie mobile tambem ja foi ligada: o Bar consegue abrir ou retomar o `Checkout` no detalhe do candidato, e o Musico passa a enxergar o status financeiro publicado em modo somente leitura. O launcher Android do CTA foi endurecido para usar `Linking.openURL`, evitando o comportamento de toque sem efeito visto no device de homologacao. Em seguida, o fluxo mobile de auth do Checkout foi endurecido em duas camadas: primeiro com token explicito no `invoke`, depois com `refreshSession()` forcado e `fetch` direto na URL da Edge Function com `apikey` e `Authorization` montados manualmente, e por fim com a propria Edge Function validando o `Bearer` de forma explicita via `auth.getUser(accessToken)` sobre o client admin. Na etapa mais recente, a fundacao de `Connect` entrou no app e no Supabase: o perfil do Musico passou a expor onboarding/sincronizacao de recebimento Stripe, `account_payment_profiles` ganhou colunas de conta conectada e novas Edge Functions passaram a criar conta, sincronizar status e tentar liberar o repasse apos show concluido. O `Checkout` real de teste ja foi homologado end-to-end: a cobranca de `R$ 350,00` gerou `checkout.session.completed` e `payment_intent.succeeded` com webhook `200`, e a ocorrencia financeira foi atualizada de `funds_held` para `transferred` depois do primeiro repasse real em `test mode`, preservando `platform_fee_cents = 5250`, `musician_payout_cents = 29750` e `stripe_transfer_id = tr_3TKK5mK1KRClNlfA1v9gSNIJ`. O onboarding Stripe Connect do Musico tambem ja foi homologado com `stripe_connected_account_status = ready`, `stripe_transfers_capability_status = active` e `stripe_payouts_capability_status = active`. Agora o endpoint de webhook de `Contas conectadas e v2` tambem ja foi publicado em `supabase/functions/stripe-connect-webhook`, o destino correspondente ja foi criado na Stripe e o `STRIPE_CONNECT_WEBHOOK_SECRET` ja foi cadastrado no Supabase. Um smoke `POST` com assinatura invalida confirmou que o runtime esta lendo e validando esse secret. Depois do ajuste de gateway JWT das functions de Connect, um segundo Musico real de teste tambem concluiu onboarding com sucesso e chegou novamente em `ready/active`. Apesar disso, o Dashboard da Stripe em modo de teste nao exibiu nenhum `v2.core.account*` em `Workbench > Events`, e o `Event deliveries` do destino permaneceu vazio. Entao, por enquanto, o sync automatico de Connect segue sem evidencia de entrega real e o fallback operacional continua sendo o sync manual por app. O que falta agora e definir a regra comercial definitiva de `sinal` vs `saldo`.

#### BKL-032 [P1] Implementar notificacoes push

Status: IN_PROGRESS
Atualizado em: 2026-04-09
Evidencias: `NOTIFICATIONS.md`, `TASK-166`, `TASK-167`, `TASK-168`, `mobile/src/features/notifications/notifications.ts`, `mobile/src/features/notifications/notifications-provider.tsx`, `mobile/src/features/notifications/notification-preferences-card.tsx`, `mobile/app/_layout.tsx`, `mobile/app/bar/profile.tsx`, `mobile/app/musician/profile.tsx`, `mobile/app.json`, `mobile/.env.example`, `supabase/migrations/20260409_026_push_notifications_foundation.sql`, `supabase/functions/marketplace-push-dispatch/index.ts`

Descricao:
Notificar sobre novas vagas, candidaturas, convites e confirmacoes.

Criterios de aceite:

- notificacoes enviadas para eventos-chave
- preferencia de notificacao configuravel
- comportamento em foreground e background definido

Observacao:
A fundacao da trilha ja esta implementada no app e no Supabase. O mobile agora possui `PushNotificationsProvider`, secao de preferencias nos perfis de Bar e Musico, sincronizacao de token por instalacao e abertura contextual de rota quando o usuario toca na notificacao. No backend, a migration `20260409_026_push_notifications_foundation.sql` criou `account_notification_preferences`, `account_push_registrations`, `push_notification_deliveries` e o RPC `upsert_account_push_registration(...)`, enquanto a Edge Function `marketplace-push-dispatch` foi publicada no Supabase para application, invite, chat e contract confirmation. O endpoint ja responde `405 method_not_allowed` em `GET`, confirmando que esta online e aceitando `POST`, e a `release` correspondente ja foi publicada no device `192.168.0.98:38715` sem regressao de bootstrap standalone. O item segue `IN_PROGRESS` porque ainda falta homologar no device a permissao do sistema, a sincronizacao do token Expo e o recebimento de pelo menos um push remoto real. A categoria de pagamentos ja existe nas preferencias, mas os pushes de pagamento propriamente ditos ficam para a proxima etapa dessa trilha.

#### BKL-033 [P1] Implementar geolocalizacao e distancia

Status: DONE
Atualizado em: 2026-04-09
Evidencias: `mobile/src/shared/lib/geolocation.ts`, `mobile/src/features/search/bar-artist-search.ts`, `mobile/src/features/search/bar-artist-search-screen.tsx`, `mobile/src/features/search/bar-artist-detail-screen.tsx`, `mobile/src/features/opportunities/opportunities.ts`, `mobile/app/musician/home.tsx`, `mobile/app/bar/home.tsx`, `DATA_MODEL.md`, `TASK-067`, `TASK-123`, `TASK-124`, `TASK-125`

Descricao:
Melhorar descoberta por proximidade e deslocamento.

Criterios de aceite:

- calculo de distancia entre contratante e musico
- filtros por raio de atuacao
- fallback quando localizacao nao estiver disponivel

Observacao:
O marketplace agora calcula distancia aproximada a partir do `CEP` em runtime, sem depender de persistencia de coordenadas no banco nesta fase. A busca do Bar passou a ordenar artistas por proximidade e a filtrar por `No raio do artista`, `Ate 25 km` e `Ate 50 km`. O feed do Musico passou a exibir distancia estimada ate a vaga e a respeitar o filtro `No meu raio` com base em `performance_radius_km`, mantendo fallback por cidade/UF quando a geolocalizacao nao estiver disponivel. A homologacao funcional no aparelho passou, encerrando o item.

#### BKL-034 [P2] Criar planos premium para bares e musicos

Descricao:
Adicionar monetizacao por assinatura e destaque.

Criterios de aceite:

- diferencas entre plano gratis e premium definidas
- gating de features funcionando
- regras de visibilidade documentadas

#### BKL-035 [P2] Implementar contratacao recorrente

Descricao:
Permitir criar series de eventos recorrentes para bares parceiros.

Criterios de aceite:

- criacao de recorrencia mensal ou semanal
- visualizacao clara na agenda
- confirmacao de disponibilidade do musico respeitada

#### BKL-039 [P1] Definir cobranca recorrente por ocorrencia com janela de 48h

Status: IN_PROGRESS
Atualizado em: 2026-04-09
Evidencias: `BACKLOG.md`, `TASK-084`, `TASK-133`, `TASK-134`, `TASK-150`, `TASK-151`, `TASK-152`, `TASK-153`, `TASK-154`, `TASK-155`, `TASK-156`, `TASK-157`, `TASK-158`, `TASK-160`, `TASK-161`, `PAYMENTS.md`, `supabase/migrations/20260409_023_stripe_platform_payment_foundation.sql`, `supabase/migrations/20260409_025_stripe_connect_accounts_and_payout_state.sql`, `supabase/functions/stripe-connect-webhook/index.ts`

Descricao:
Modelar a cobranca de eventos recorrentes para que cada data seja faturada separadamente, com captura/confirmacao financeira antes da execucao e retencao do valor ate a conclusao do evento.

Criterios de aceite:

- serie recorrente gera ocorrencias individuais com status de pagamento proprio
- Bar salva um metodo de pagamento uma unica vez para autorizacao recorrente futura
- cada ocorrencia entra em janela de cobranca ate `48h` antes do evento
- falha de cobranca dispara aviso, retentativa e regra de risco antes da data
- repasse ao Musico e fee da plataforma sao liquidados por ocorrencia concluida

Observacao:
Direcao recomendada: usar uma politica `pay-per-occurrence`. O Bar aceita a serie recorrente e deixa um metodo elegivel para cobrancas futuras; cada ocorrencia gera sua propria cobranca em `T-48h`, com valor retido ate o evento ser marcado como concluido. Se o pagamento falhar, a plataforma entra em contingencia com nova tentativa e prazo operacional curto antes de expor risco para Musico e agenda. Isso permite combinar recorrencia com repasse por evento, sem exigir prepagamento integral da serie inteira. A modelagem base por ocorrencia ja foi criada em `contract_payment_occurrences`, o `Checkout` passou a marcar `setup_future_usage = off_session` para preparar a fase seguinte, e a camada de conta conectada do Musico ja foi homologada com onboarding `ready` e primeiro repasse real em `test mode`. O endpoint de webhook de `Contas conectadas e v2` ja foi publicado, o destino real no dashboard da Stripe tambem ja existe e o `STRIPE_CONNECT_WEBHOOK_SECRET` foi confirmado em runtime. Ainda faltam a validacao de um evento real de contas conectadas, a automacao da janela `T-48h`, as retentativas, o save de metodo recorrente e a liquidacao recorrente plenamente automatizada.

#### BKL-042 [P1] Exibir secao de ganhos com a plataforma no perfil do Musico

Status: TODO
Atualizado em: 2026-04-09
Evidencias: `BACKLOG.md`, `TASK-159`

Descricao:
Criar no perfil do Musico uma secao financeira de leitura rapida, baseada em dados reais da plataforma, separando ganhos previstos de ganhos efetivamente repassados.

Criterios de aceite:

- o perfil do Musico mostra `Previstos` e `Real` corretamente
- os valores sao liquidos, nao brutos
- a secao exibe contadores de `shows confirmados aguardando pagamento` e `repasses pendentes`
- a secao exibe `proximo repasse previsto` e `ultimo repasse enviado`
- o estado vazio funciona sem onboarding Stripe concluido
- os numeros batem com o snapshot financeiro do banco

Observacao:
O item fica intencionalmente separado da trilha de auditoria e dashboards para nao misturar UX mobile com infraestrutura analitica. A V1 deve usar dados reais de `contract_payment_occurrences`, sem mock e sem filtro por periodo. `Previstos` significa o valor liquido ainda nao transferido ao Musico, e `Real` significa o valor liquido ja efetivamente transferido.

#### BKL-043 [P1] Criar trilha financeira auditavel e base para dashboards

Status: TODO
Atualizado em: 2026-04-09
Evidencias: `BACKLOG.md`, `TASK-159`

Descricao:
Adicionar uma trilha financeira append-only por ocorrencia e expor snapshots e views analiticas para leitura executiva e futura integracao de dashboards.

Criterios de aceite:

- toda mudanca financeira relevante gera evento auditavel por ocorrencia
- existe snapshot agregado do Musico para consumo do app
- existe view ou consulta pronta para dashboards demonstrativos
- uma app `.NET` consegue ler os dados do Supabase diretamente
- logs deixam de ser a fonte principal de BI e ficam como apoio operacional

Observacao:
Este item prepara a camada de auditoria e analytics sem criar banco paralelo nem warehouse nesta fase. A direcao escolhida e ler o Supabase diretamente, preferencialmente por views e RPCs e, quando fizer sentido, por Postgres via `Npgsql`. O historico atual ja permite snapshot confiavel, mas a auditoria cronologica completa passa a valer a partir da futura tabela append-only de eventos financeiros.

### EP09 - IA, analytics e expansao

#### BKL-036 [P2] Criar recomendacao inteligente de musicos e vagas

Descricao:
Sugerir matches com base em estilo, local, historico e orcamento.

Criterios de aceite:

- logica de recomendacao definida
- recomendacoes aparecem na home de ambos os lados
- resultados podem ser medidos

#### BKL-037 [P2] Implementar analytics para o Bar

Descricao:
Exibir dados de performance musical e historico de contratacoes.

Criterios de aceite:

- painel com historico de eventos e artistas contratados
- filtros por periodo e estilo
- KPIs principais definidos

#### BKL-038 [P2] Implementar substituicao emergencial

Descricao:
Permitir acionar busca urgente por substitutos em caso de cancelamento.

Criterios de aceite:

- contratacao marcada como urgente
- artistas compativeis recebem maior destaque
- regras de taxa adicional definidas

## Ordem sugerida de execucao

### Sprint 0 - Discovery e base

- BKL-001
- BKL-002
- BKL-003
- BKL-005
- BKL-006
- BKL-007

Resultado esperado:
base tecnica inicial pronta e mapa de telas do MVP fechado

### Sprint 1 - Onboarding e perfis

- BKL-009
- BKL-010
- BKL-012
- BKL-013
- BKL-014

Resultado esperado:
usuario consegue entrar no app e completar perfil funcional

### Sprint 2 - Marketplace inicial

- BKL-016
- BKL-017
- BKL-018
- BKL-019
- BKL-020
- BKL-021

Resultado esperado:
vaga pode ser criada, descoberta e receber candidaturas

### Sprint 3 - Contratacao e agenda

- BKL-023
- BKL-024
- BKL-025

Resultado esperado:
fluxo principal de fechamento de oportunidade concluido

### Sprint 4 - Reputacao e estabilizacao do MVP

- BKL-028
- BKL-015
- BKL-029
- BKL-008

Resultado esperado:
MVP medivel, mais confiavel e pronto para validacao com usuarios reais

## Dependencias importantes

- definicao da stack tecnica influencia toda a execucao
- estrategia de upload de video impacta custo, storage e performance
- modelo de dados de perfis, vagas, candidaturas e contratacoes deve ser estabilizado cedo
- chat interno depende da decisao de backend em tempo real
- pagamento integrado depende de compliance, operacao e provedor

## Riscos iniciais

- tentar incluir pagamento, push e IA cedo demais pode atrasar o MVP
- divergir do prototipo agora versionado em `Prototipo/` pode gerar retrabalho visual e navegacional
- upload de video nativo pode elevar custo e complexidade
- regras mal definidas de cancelamento e disputa podem gerar desgaste operacional
- excesso de campos no cadastro pode reduzir conversao inicial

## Decisoes pendentes

- stack mobile: Flutter, React Native ou outra
- backend: Firebase, Supabase, backend proprio ou abordagem hibrida
- metodo inicial de autenticacao: email, telefone, social login ou combinacao
- provider de storage para fotos e videos
- modelo inicial de chat: tempo real nativo do backend ou servico dedicado
- modelo de comissao e politica de cancelamento
- estrategia de moderacao e suporte
- consolidacao final das telas do MVP que ainda nao possuem prototipo explicito

## Recomendacoes praticas para as proximas sessoes

1. Usar `Prototipo/` e `UI_MAP.md` como referencia obrigatoria antes de qualquer refactor visual ou nova tela.
2. Refatorar o shell atual para convergir ao prototipo antes de expandir telas novas fora da linguagem definida.
3. Escolher a stack tecnica e registrar essa decisao no proprio backlog ou em um `ARCHITECTURE.md`.
4. Depois disso, seguir a Sprint 0 com implementacao guiada pelos prototipos ja versionados.

## Sugestao de proximos artefatos

- `ARCHITECTURE.md` para decisoes tecnicas
- `USER_FLOWS.md` para fluxos detalhados de Bar e Musico
- `DATA_MODEL.md` para entidades e relacionamentos
- `UI_MAP.md` para mapa de telas baseado nos prototipos
