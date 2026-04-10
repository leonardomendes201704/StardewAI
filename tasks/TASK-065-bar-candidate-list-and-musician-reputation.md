# TASK-065 - Exibir lista de candidatos do Bar e reputacao do Musico

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-020, BKL-029

## Objetivo

Permitir que o Bar abra uma vaga, veja a lista de candidatos e navegue para um detalhe do Musico com score, portfolio e depoimentos de outros bares.

## Entregue

- migration `20260408_012_artist_reviews_and_bar_candidate_views.sql` com tabela `public.artist_reviews`, RLS e seed de reviews do Musico
- nova camada `bar-candidates.ts` para listar candidaturas da vaga e montar o detalhe publico do Musico
- tela de lista de candidatos por vaga
- tela de detalhe do candidato com portfolio visual, links publicos, score e comentarios
- CTA `Candidatos` na home do Bar apontando para a lista da vaga
- atualizacao de `DATA_MODEL.md`, `ARCHITECTURE.md`, `TASKS.md` e `BACKLOG.md`

## Validacao

- `apply_migration` no Supabase com sucesso
- `npx.cmd tsc --noEmit`
- consulta SQL confirmando `3` reviews seedadas com media `4.7` para o Musico existente

## Observacao

- nao havia nenhuma linha real em `public.opportunity_applications` no momento da implementacao; a homologacao funcional desta trilha depende de pelo menos uma candidatura real apos a publicacao da build
