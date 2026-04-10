# TASK-052 - Homologar criacao real de vaga e exibicao no feed do Musico

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-018, BKL-017

## Objetivo

Confirmar no Supabase que a primeira vaga real criada pelo Bar foi persistida com status aberto e ficou disponivel no feed inicial do Musico.

## Entregaveis previstos

- evidencia de persistencia real em `public.opportunities`
- confirmacao do status `open`
- atualizacao de `TASKS.md` e `BACKLOG.md`

## Entregue

- consulta no Supabase confirmou a vaga real `Toque uma pra mim` criada pelo `Bar do Leo`
- a vaga ficou persistida com status `open`, budget, genero, categoria, data e local completos
- a trilha foi registrada em `TASKS.md` e refletida no `BACKLOG.md`

## Validacao

- `public.opportunities`: `1` registro aberto em `2026-04-08`
- `title`: `Toque uma pra mim`
- `status`: `open`
- `event_date`: `2026-04-12`
- `start_time`: `19:00:00`
- `budget_cents`: `35000`
- `music_genre`: `Pop`
- `artist_category`: `Solo`
- `city/state`: `Praia Grande/SP`
- `location_label`: preenchido
