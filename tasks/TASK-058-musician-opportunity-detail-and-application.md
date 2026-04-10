# TASK-058 - Implementar detalhe de vaga e candidatura do Musico

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-019, BKL-020, BKL-017

## Objetivo

Permitir que o Musico abra uma vaga do feed, visualize os detalhes operacionais da oportunidade e envie sua candidatura diretamente pelo app.

## Entregaveis previstos

- migration `20260408_008_opportunity_applications_foundation.sql`
- tabela `public.opportunity_applications` com RLS e unicidade por vaga e artista
- home do Musico navegando para uma tela dedicada de detalhe
- query de detalhe da vaga com status da candidatura atual
- mutation de candidatura do Musico
- atualizacao de `TASKS.md`, `BACKLOG.md`, `DATA_MODEL.md` e `ARCHITECTURE.md`

## Entregue

- migrations `20260408_008_opportunity_applications_foundation.sql` e `20260408_009_harden_trigger_function_search_path.sql` aplicadas no Supabase
- tabela `public.opportunity_applications` com unicidade por vaga e artista, trigger de `updated_at` e RLS
- policy de `public.opportunities` ampliada para permitir leitura pelo Musico que ja se candidatou
- home do Musico atualizada para abrir a rota `/musician/opportunities/[id]`
- detalhe da vaga com hero, briefing, estrutura, dados da casa e CTA de candidatura
- mutation de candidatura integrada ao detalhe, com invalidacao de feed e detalhe apos o submit
- status da candidatura refletido no card do feed e no detalhe da vaga
- atualizacao de `TASKS.md`, `BACKLOG.md`, `DATA_MODEL.md` e `ARCHITECTURE.md`

## Validacao

- `npx.cmd tsc --noEmit`
- migrations aplicadas com sucesso no Supabase
- `security advisors` revistos apos a migration
