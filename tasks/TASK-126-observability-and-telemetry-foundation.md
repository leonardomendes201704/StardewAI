# TASK-126 - Implementar observabilidade e telemetria basica

Status: DONE
Inicio: 2026-04-09
Fim: 2026-04-09
Backlog relacionado:

- BKL-008

## Objetivo

Preparar o app e o Supabase para registrar eventos principais do funil e capturar erros criticos do runtime do MVP.

## Escopo

- criar tabelas e views de observabilidade no Supabase
- capturar erros globais de runtime, `query` e `mutation`
- registrar `screen_view` e restauracao de sessao
- instrumentar eventos de auth, perfil, midia, vaga, candidatura, convite, contratacao, chat e review
- documentar a taxonomia de eventos e a forma de leitura no ambiente atual

## Resultado esperado

O projeto passa a ter baseline minima de telemetria para ler o funil do marketplace e diagnosticar falhas recorrentes sem depender de stack externa.

## Resultado

Foi criada a migration `supabase/migrations/20260409_021_observability_telemetry_foundation.sql`, com `public.telemetry_events`, `public.app_error_events` e views de apoio para leitura do MVP. No app, a camada `mobile/src/features/observability/` passou a capturar `screen_view`, sessao restaurada, erros globais, falhas de `query/mutation` e eventos do funil nas mutations principais de auth, perfis, vagas, contratos, chat, reviews e midia. A operacao foi consolidada em `OBSERVABILITY.md`, deixando o ambiente pronto para analise basica do MVP no Supabase.
