# TASK-094 - Homologar avaliacoes reais pos-evento no Supabase

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-028

## Objetivo

Confirmar no Supabase que Bar e Musico conseguiram registrar avaliacoes reais de pos-evento com score composto e comentario persistido.

## Evidencias validadas

- `public.venue_reviews` com `1` review real de Musico para o Bar
- `public.artist_reviews` com `1` review real de Bar para o Musico
- ambas vinculadas a `opportunity_id` real e com:
  - `punctuality_rating`
  - `quality_rating`
  - `professionalism_rating`
  - `rating` recalculado

## Observacao

- a review real do Musico ficou com score `5`, derivado de `4/5/5`
- a review real do Bar ficou com score `5`, derivado de `5/4/5`
