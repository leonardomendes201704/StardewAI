# TASK-129 - Homologar observabilidade e telemetria no device

Status: DONE
Inicio: 2026-04-09
Fim: 2026-04-09
Backlog relacionado:

- BKL-008

## Objetivo

Confirmar no aparelho e no projeto Supabase que a nova camada de observabilidade registra eventos do funil e erros do app sem regressao funcional.

## Evidencia esperada

- a release abre normalmente no device, sem dependencia de Metro
- o fluxo principal do app continua operacional
- ao atravessar parte do funil, novas linhas aparecem em `public.telemetry_events`
- views `public.telemetry_daily_rollup` e `public.telemetry_funnel_snapshot` respondem
- se ocorrer alguma falha de query, mutation ou runtime, a linha correspondente aparece em `public.app_error_events`

## Evidencia funcional coletada

- navegacao geral validada entre home, agenda, chat e perfis
- `Bar` conseguiu publicar e editar vaga sem regressao
- `Musico` conseguiu se candidatar a vaga sem regressao
- chat permaneceu operacional com envio real de mensagem
- a `release` publicada no device manteve bootstrap standalone normal

## Resultado

A homologacao funcional no device foi complementada pela confirmacao remota no Supabase. As tabelas `public.telemetry_events` e `public.app_error_events` foram confirmadas no projeto, assim como as views `public.telemetry_daily_rollup` e `public.telemetry_funnel_snapshot`. Depois do hardening da ingestao por RPC e da nova `release`, o smoke test remoto passou a registrar eventos reais no banco, incluindo `session_restored`, `app_session_started`, `screen_view` e `app_foregrounded`. Com isso, o item `BKL-008` ficou apto para encerramento formal no backlog.
