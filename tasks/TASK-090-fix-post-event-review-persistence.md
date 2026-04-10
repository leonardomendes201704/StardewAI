# TASK-090 - Corrigir persistencia da avaliacao pos-evento

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-028

## Objetivo

Corrigir a falha de salvamento da avaliacao pos-evento identificada no fluxo real do Musico.

## Entregue

- troca de `upsert` por fluxo explicito de `insert/update` em `mobile/src/features/reviews/reviews.ts`
- normalizacao de erros do Supabase para exibir a mensagem real na UI quando houver falha
- preservacao do comportamento de edicao da review ja existente pelo mesmo contrato

## Validacao

- `npx.cmd tsc --noEmit`
- revisao do fluxo de persistencia em `venue_reviews` e `artist_reviews`

## Hipotese corrigida

- o caminho anterior usava `upsert` sobre indices unicos parciais, combinacao que e fragil no fluxo atual via Supabase/PostgREST
