# TASK-063 - Exibir score e comentarios do Bar no detalhe da vaga

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-019, BKL-029

## Objetivo

Enriquecer o detalhe da vaga do Musico com reputacao visivel do estabelecimento, incluindo nota media em estrelas e comentarios de musicos que ja tocaram na casa.

## Entregue

- migration `20260408_011_venue_reviews_foundation.sql` com tabela `public.venue_reviews`, RLS e seed de avaliacoes de exemplo
- query do detalhe da vaga ampliada para carregar reviews do Bar, calcular media e quantidade
- nova secao de reputacao da casa no fim do detalhe da vaga
- renderizacao de score em estrelas, media numerica e cards de comentario
- atualizacao de `DATA_MODEL.md`, `ARCHITECTURE.md`, `TASKS.md` e `BACKLOG.md`

## Validacao

- `apply_migration` no Supabase com sucesso
- `npx.cmd tsc --noEmit`
- consulta SQL confirmando `3` reviews seedadas com media `4.7` para o Bar existente
