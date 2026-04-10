# TASK-130 - Endurecer ingestao de observabilidade via RPC

Status: DONE
Inicio: 2026-04-09
Fim: 2026-04-09
Backlog relacionado:

- BKL-008

## Objetivo

Eliminar a dependencia de `insert` direto do app nas tabelas de observabilidade e tornar a ingestao de telemetria confiavel no runtime mobile autenticado.

## Escopo

- criar RPCs autenticadas para ingestao de `telemetry_events` e `app_error_events`
- ajustar o app para usar `supabase.rpc(...)` em vez de `insert` direto
- aplicar a migration remota no projeto Supabase
- confirmar a existencia das novas funcoes no schema `public`

## Resultado

Foi criada a migration `supabase/migrations/20260409_022_observability_ingest_rpcs.sql` com as funcoes `public.log_telemetry_event` e `public.log_app_error_event`, ambas `security definer` e baseadas em `auth.uid()`. O app foi ajustado em `mobile/src/features/observability/telemetry.ts` para consumir essas RPCs. A migration foi aplicada no projeto Supabase e as duas funcoes foram confirmadas remotamente via MCP.
