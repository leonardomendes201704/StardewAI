# TASK-097 - Implementar convite direto do Bar para o Musico

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-022

## Objetivo

Permitir que o Bar convide um Musico direto do perfil publico, associando esse convite a uma vaga existente ou a um fluxo guiado de criacao de vaga, com aceite ou recusa rastreavel.

## Entregue

- migration `supabase/migrations/20260408_017_direct_opportunity_invites.sql`
- novos estados de candidatura:
  - `invited`
  - `declined`
- novas RPCs seguras no Supabase:
  - `create_direct_opportunity_invite`
  - `decline_direct_opportunity_invite`
  - `cancel_direct_opportunity_invite`
- tela dedicada de convite direto em `mobile/src/features/opportunities/bar-direct-invite-screen.tsx`
- rota `mobile/app/bar/invite/[artistId].tsx`
- CTA real de convite no perfil publico do artista em `mobile/src/features/search/bar-artist-detail-screen.tsx`
- fluxo guiado de criacao de vaga com retorno para o convite em:
  - `mobile/app/bar/opportunities/new.tsx`
  - `mobile/src/features/opportunities/opportunity-editor-screen.tsx`
- mutation de convite direto e filtros de feed em `mobile/src/features/opportunities/opportunities.ts`
- aceite e recusa do convite do lado do Musico em `mobile/src/features/opportunities/opportunity-detail-screen.tsx`
- cancelamento do convite do lado do Bar em `mobile/src/features/opportunities/bar-candidate-detail-screen.tsx`
- ajustes de copy/contexto no feed do Musico e no chat em:
  - `mobile/app/musician/home.tsx`
  - `mobile/src/features/chat/chat.ts`

## Validacao

- `npx.cmd tsc --noEmit`
- migration aplicada no projeto Supabase
- verificacao remota confirmando:
  - enum `opportunity_application_status` com `invited` e `declined`
  - funcoes `create_direct_opportunity_invite`, `decline_direct_opportunity_invite` e `cancel_direct_opportunity_invite`

## Observacao

- o runtime MCP desta thread perdeu autenticacao no meio da sessao, entao a migration foi aplicada com sucesso por um subprocesso limpo de `codex exec` apos renovar `codex mcp login supabase`
- a homologacao funcional no device ainda depende do ciclo real: convidar artista -> aceitar ou recusar convite -> validar reflexo em candidatura/chat/contrato
