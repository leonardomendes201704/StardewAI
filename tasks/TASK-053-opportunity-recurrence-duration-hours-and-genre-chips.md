# TASK-053 - Implementar recorrencia semanal, duracao em horas e estilo por chips nas vagas

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-018, BKL-017

## Objetivo

Evoluir o modulo de vagas para suportar recorrencia semanal por dia da semana, trocar a duracao do evento para horas e substituir o campo manual de estilo musical por selecao em chips.

## Entregaveis previstos

- migration de oportunidades com `duration_hours` e `recurrence_days`
- editor do Bar atualizado para recorrencia semanal e estilo por chips
- feed do Musico e home do Bar exibindo duracao em horas e recorrencia quando existir
- atualizacao de `TASKS.md`, `BACKLOG.md`, `DATA_MODEL.md` e `ARCHITECTURE.md`

## Entregue

- migration `20260408_006_opportunities_recurrence_duration_hours.sql` com `duration_hours` e `recurrence_days`
- editor do Bar com recorrencia semanal por chips, duracao em horas e selecao de estilo musical por chips
- homes do Bar e do Musico atualizadas para exibir agenda recorrente e duracao em horas
- atualizacao de `DATA_MODEL.md`, `ARCHITECTURE.md`, `TASKS.md` e `BACKLOG.md`

## Validacao

- `npx.cmd tsc --noEmit`
