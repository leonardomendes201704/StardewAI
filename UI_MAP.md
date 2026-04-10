# TocaAI - UI Map e Direcao de Prototipo

Ultima atualizacao: 2026-04-08
Status: mapa expandido de referencia para implementacao visual

## Fonte de verdade

A pasta `Prototipo/` segue como referencia principal de UI.

Regras obrigatorias:

- quando houver conflito entre scaffold tecnico e prototipo, o prototipo prevalece
- telas nao prototipadas explicitamente devem nascer na mesma linguagem `electric_nightfall`
- marca oficial: `TocaAI`
- as telas devem preservar:
  - atmosfera `dark-first`
  - cards em vidro e blur
  - headline editorial forte
  - CTAs com gradiente neon
  - chips e badges como camada de contexto rapido

## Direcao visual-base

Referencia primaria:

- `Prototipo/electric_nightfall/DESIGN.md`

Tokens obrigatorios:

- fundo principal: `#0d0d16`
- destaque principal: `#f3ffca`
- destaque secundario: `#00eefc`
- headlines com `Spline Sans`
- corpo com `Manrope`

## Mapa mestre de telas do MVP

### 1. Onboarding

Origem:

- `Prototipo/onboarding/code.html`
- `Prototipo/onboarding/screen.png`

Rota real:

- `mobile/app/index.tsx`

Papel:

- entrada da jornada
- escolha entre `Estabelecimento` e `Musico`

### 2. Auth por email

Origem visual:

- derivada do onboarding e do sistema `electric_nightfall`

Rotas reais:

- `mobile/app/auth/email.tsx`
- `mobile/app/auth/callback.tsx`
- `mobile/app/auth/recovery.tsx`

Papel:

- criar conta
- entrar
- solicitar recuperacao
- reenviar confirmacao
- concluir callback nativo
- definir nova senha no app

### 3. Home do Bar

Origem:

- `Prototipo/home_bar/code.html`
- `Prototipo/home_bar/screen.png`

Rota real:

- `mobile/app/bar/home.tsx`

Blocos obrigatorios:

- hero CTA `Publicar vaga`
- atalhos para `Nova vaga`, `Buscar artistas` e `Agenda`
- cards das vagas do proprio estabelecimento
- agenda em destaque
- previews reais de artistas para convite

### 4. Editor de vaga

Origem visual:

- derivada da home do Bar e do sistema `electric_nightfall`

Rotas reais:

- `mobile/app/bar/opportunities/new.tsx`
- `mobile/app/bar/opportunities/[id].tsx`

Papel:

- criar ou editar vaga
- publicar, salvar rascunho, cancelar e reabrir

### 5. Busca ativa de artistas

Origem visual:

- derivada da home do Bar e do perfil publico do Musico

Rota real:

- `mobile/app/search.tsx` quando a conta e `Bar`

Papel:

- filtrar por regiao
- filtrar por genero
- filtrar por categoria
- filtrar por cache

### 6. Perfil publico do Musico

Origem:

- `Prototipo/perfil_do_m_sico/code.html`
- `Prototipo/perfil_do_m_sico/screen.png`

Rotas reais:

- `mobile/app/bar/artists/[artistId].tsx`
- `mobile/app/bar/invite/[artistId].tsx`

Papel:

- avaliar portfolio, repertorio, links e reputacao
- iniciar convite direto

### 7. Home do Musico

Origem:

- `Prototipo/home_m_sico/code.html`
- `Prototipo/home_m_sico/screen.png`

Rota real:

- `mobile/app/musician/home.tsx`

Blocos obrigatorios:

- topo com localizacao contextual
- filtros curtos por periodo, regiao e cache
- cards de oportunidade com imagem, urgencia, data, local, estilos e CTA
- status de candidatura ou convite quando aplicavel

### 8. Detalhe da vaga

Origem visual:

- derivada da home do Musico, do perfil publico e do sistema `electric_nightfall`

Rota real:

- `mobile/app/musician/opportunities/[id].tsx`

Papel:

- mostrar detalhes suficientes para decidir rapido
- exibir fotos do Bar
- exibir reputacao publica da casa
- permitir candidatura, aceite, recusa, conclusao, cancelamento e remarcacao conforme contexto

### 9. Lista de candidatos do Bar

Origem visual:

- derivada da home do Bar e do perfil publico do Musico

Rotas reais:

- `mobile/app/bar/candidates/[opportunityId].tsx`
- `mobile/app/bar/candidate/[applicationId].tsx`

Papel:

- listar candidatos por vaga
- abrir detalhe do candidato
- conversar
- selecionar para contratacao
- cancelar ou remarcar quando ja houver contrato

### 10. Agenda e chat

Origem:

- `Prototipo/agenda_e_chat/code.html`
- `Prototipo/agenda_e_chat/screen.png`

Rotas reais:

- `mobile/app/bar/agenda.tsx`
- `mobile/app/musician/agenda.tsx`
- `mobile/app/chat.tsx`
- `mobile/app/chat/application/[applicationId].tsx`

Papel:

- consolidar fluxo ativo e historico
- exibir dias bloqueados do Musico
- concentrar conversa contextual da candidatura ou contratacao

### 11. Reviews pos-evento

Origem visual:

- derivada do sistema `electric_nightfall`

Rotas reais:

- `mobile/app/bar/reviews/[contractId].tsx`
- `mobile/app/musician/reviews/[contractId].tsx`

Papel:

- coletar review apos evento concluido
- mostrar estado final readonly apos salvar

### 12. Perfis proprios

Origem visual:

- derivada do perfil do Musico do prototipo e do shell base

Rotas reais:

- `mobile/app/bar/profile.tsx`
- `mobile/app/musician/profile.tsx`

Papel:

- editar dados operacionais
- subir portfolio e fotos
- manter completude de perfil
- configurar preferencias de notificacao push e recebimento no dispositivo

## Estados transversais obrigatorios

### Loading

- nunca usar tela branca
- manter atmosfera dark-first
- preferir skeletons e scaffolds silenciosos dentro da propria tela

### Empty state

- usar `GlassCard`, tipografia editorial e CTA claro
- cada empty state precisa explicar a proxima acao

### Error state

- manter o mesmo padrao visual premium
- mensagem curta, objetiva e acao de retorno ou retentativa

### Success state

- apos salvar ou confirmar algo importante, reduzir friccao
- esconder formulario quando o estado final for readonly, como em reviews

## Mapa de navegacao real derivado

### Fluxo do Bar

1. `index`
2. `auth/email`
3. `bar/profile`
4. `bar/home`
5. `bar/opportunities/new` ou `search`
6. `bar/candidates/[opportunityId]`
7. `bar/candidate/[applicationId]`
8. `chat/application/[applicationId]`
9. `bar/agenda`
10. `bar/reviews/[contractId]`

### Fluxo do Musico

1. `index`
2. `auth/email`
3. `musician/profile`
4. `musician/home`
5. `musician/opportunities/[id]`
6. `chat/application/[applicationId]`
7. `musician/agenda`
8. `musician/reviews/[contractId]`

## Cobertura dos prototipos vs telas derivadas

### Diretamente cobertas por prototipo

- onboarding
- home do Bar
- home do Musico
- perfil publico do Musico
- agenda/chat

### Derivadas sem prototipo explicito, mas ja mapeadas

- auth por email
- editor de vaga
- busca ativa de artistas
- detalhe da vaga
- lista de candidatos
- detalhe do candidato
- review por contrato
- perfis proprios do Bar e do Musico

## Criterio para novas telas

Qualquer tela nova do MVP deve registrar:

- rota real
- papel de negocio
- tela-base do prototipo da qual herda a linguagem
- estados `loading`, `empty`, `error` e `success`

Sem isso, a tela nao deve ser considerada fechada para backlog.
