# TASK-102 - Implementar cancelamento e remarcacao basicos

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-026

## Objetivo

Permitir cancelamento com motivo e remarcacao basica de contratacoes ativas, com historico visivel para Bar e Musico.

## Entregue

- migration `supabase/migrations/20260408_019_contract_cancellation_and_reschedule_basics.sql`
- novas colunas em `public.contracts`:
  - `cancellation_reason`
  - `cancelled_by`
  - `last_rescheduled_at`
  - `last_rescheduled_by`
  - `last_reschedule_reason`
- nova tabela `public.contract_schedule_changes` para historico de agenda
- RPC `cancel_opportunity_contract_with_reason`
- RPC `reschedule_opportunity_contract`
- compatibilidade mantida com `cancel_opportunity_contract`
- client mobile atualizado em:
  - `mobile/src/features/contracts/contracts.ts`
  - `mobile/src/features/contracts/contract-operation-modals.tsx`
  - `mobile/src/features/opportunities/opportunity-detail-screen.tsx`
  - `mobile/src/features/opportunities/bar-candidate-detail-screen.tsx`
- fluxo unificado de cancelamento com motivo tanto para contratacao comum quanto para convite direto pendente
- modais de remarcacao com data, horario, duracao, local e motivo
- historico de remarcacoes visivel nas telas de detalhe para os dois lados

## Validacao

- `npx.cmd tsc --noEmit`
- migration aplicada no Supabase via `codex exec` com MCP autenticado
- validacao remota confirmando:
  - `public.contracts` com as `5` novas colunas
  - `public.contract_schedule_changes` criada

## Observacao

- nesta etapa, o cancelamento nao reabre automaticamente a vaga; essa decisao continua manual para evitar reabertura ambigua
