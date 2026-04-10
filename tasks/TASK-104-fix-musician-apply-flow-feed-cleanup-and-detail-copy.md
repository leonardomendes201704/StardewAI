# TASK-104 - Corrigir candidatura do Musico, limpar feed e reduzir textos do detalhe

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-019, BKL-020

## Objetivo

Eliminar o falso bloqueio de candidatura em vagas abertas, esconder do feed oportunidades que ja nao sao mais candidataveis e reduzir ruido textual no detalhe da vaga.

## Entregue

- migration `supabase/migrations/20260408_020_apply_to_open_opportunity_rpc.sql`
- nova RPC `public.apply_to_open_opportunity(uuid)` com validacoes explicitas para candidatura do Musico
- client mobile atualizado em:
  - `mobile/src/features/opportunities/opportunities.ts`
  - `mobile/src/features/opportunities/opportunity-detail-screen.tsx`
- caminho de candidatura do Musico agora usa RPC em vez de `insert` direto
- feed do Musico passou a esconder itens com contrato `confirmed`, `completed` ou `cancelled`
- feed do Musico passou a manter apenas:
  - vagas `open` sem candidatura
  - candidaturas em `submitted`, `shortlisted` ou `invited`
  - contratos `pending_confirmation`
- textos descritivos excessivos removidos das secoes de detalhe da vaga

## Validacao

- `npx.cmd tsc --noEmit`
- migration aplicada no Supabase via `codex exec` com MCP autenticado
- validacao remota confirmando:
  - funcao `public.apply_to_open_opportunity(uuid)` existente
  - `EXECUTE` concedido para `authenticated`
  - smoke test transacional da RPC com `ROLLBACK`

## Observacao

- a vaga `Vaga teste remarcacao` estava `open` e sem candidatura do Musico no banco, entao o bloqueio anterior era inconsistente com o estado real e foi endurecido por RPC para sair do caminho de RLS generica
