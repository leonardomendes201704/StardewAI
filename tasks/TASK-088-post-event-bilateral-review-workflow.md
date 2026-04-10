# TASK-088 - Implementar avaliacao bilateral pos-evento

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-028, BKL-029

## Objetivo

Transformar a reputacao em um fluxo real de pos-evento, permitindo que Bar e Musico avaliem shows concluidos com score composto e comentario publico.

## Entregue

- migration `supabase/migrations/20260408_016_post_event_reviews_workflow.sql`
- `venue_reviews` e `artist_reviews` agora com:
  - `punctuality_rating`
  - `quality_rating`
  - `professionalism_rating`
  - recalculo automatico de `rating`
- RLS endurecido para aceitar review real apenas quando existe `contract` concluido entre as partes
- camada de dados de review em `mobile/src/features/reviews/reviews.ts`
- tela compartilhada de avaliacao em `mobile/src/features/reviews/contract-review-screen.tsx`
- rotas:
  - `mobile/app/musician/reviews/[contractId].tsx`
  - `mobile/app/bar/reviews/[contractId].tsx`
- CTAs de avaliacao adicionados:
  - no detalhe da vaga do Musico
  - no detalhe do candidato do Bar
  - na agenda de historico dos dois lados

## Validacao

- migration aplicada com sucesso no Supabase
- `npx.cmd tsc --noEmit`
- smoke SQL confirmando retrocompatibilidade das reviews seedadas com os 3 criterios

## Observacao

- a homologacao funcional no device ainda depende de um ciclo real: concluir show -> avaliar Bar -> avaliar Musico
- o historico publico continua usando as mesmas tabelas, agora com origem real de pos-evento
