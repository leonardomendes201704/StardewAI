# Mobile Source Modules

Esta pasta foi reservada para a organizacao por modulos de negocio do TocaAI.

Estrutura alvo:

- `features/auth`
- `features/profiles`
- `features/opportunities`
- `features/chat`
- `features/agenda`
- `features/reviews`
- `shared/api`
- `shared/components`
- `shared/hooks`
- `shared/theme`
- `shared/utils`
- `state`

Implementado nesta fase:

- `shared/theme` com tokens visuais alinhados ao prototipo `electric_nightfall`
- `shared/components` com primitives de shell como `GlassCard`, `GlowButton`, `GhostButton`, `Avatar`, `Badge`, `InputField`, `EmptyState`, `TopBar` e `BottomNav`
- `shared/data/prototype.ts` com os dados estaticos usados para reproduzir a composicao das telas do prototipo
- `shared/api/supabase` com cliente e env da integracao Expo + Supabase
- `shared/api/query-client.ts` com a configuracao base do cache remoto
- `features/auth` com provider e gate de sessao
- `features/session` com persistencia do tipo de conta e roteamento por papel

As proximas tasks devem mover a logica de negocio para `features/` e trocar os dados estaticos por sessao e camada de dados real.
