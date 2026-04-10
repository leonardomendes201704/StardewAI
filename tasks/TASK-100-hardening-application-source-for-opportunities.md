# TASK-100 - Endurecer origem explicita de candidatura e convite em vagas

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-022

## Objetivo

Remover a dependencia de inferencia por status e timestamp no fluxo de convite direto, registrando a origem explicita da entrada em `public.opportunity_applications`.

## Entregue

- migration `supabase/migrations/20260408_018_opportunity_application_source_hardening.sql`
- enum `public.opportunity_application_source` com:
  - `marketplace_apply`
  - `direct_invite`
- coluna `public.opportunity_applications.source` com `NOT NULL` e default `marketplace_apply`
- backfill dos registros ja existentes
- policy de insert publico endurecida para aceitar apenas:
  - `status = submitted`
  - `source = marketplace_apply`
- hardening da RPC `create_direct_opportunity_invite` para gravar `source = direct_invite`
- client mobile atualizado para usar `source` explicito na deteccao de convite direto em:
  - `mobile/src/features/opportunities/opportunities.ts`
  - `mobile/src/features/opportunities/opportunity-detail-screen.tsx`
  - `mobile/src/features/opportunities/bar-candidate-detail-screen.tsx`
  - `mobile/app/musician/home.tsx`
  - `mobile/src/features/opportunities/bar-candidates.ts`
  - `mobile/src/features/chat/chat.ts`

## Validacao

- `npx.cmd tsc --noEmit`
- migration aplicada no Supabase por `codex exec` com MCP autenticado
- validacao remota confirmando:
  - coluna `source` existente e `NOT NULL`
  - enum com `marketplace_apply` e `direct_invite`
  - policy `opportunity_applications_insert_own_open` exigindo `source = marketplace_apply` e `status = submitted`
  - funcao `create_direct_opportunity_invite` gravando `source = direct_invite`

## Observacao

- a partir desta trilha, a identificacao de convite direto deixa de depender de inferencia por `status` ou sequencia temporal no app e no banco
