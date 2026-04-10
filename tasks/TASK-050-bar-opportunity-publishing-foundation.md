# TASK-050 - Implementar publicacao e listagem inicial de vagas do Bar

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-018, BKL-016, BKL-017

## Objetivo

Criar a primeira trilha real de marketplace do app: o Bar publica vagas no Supabase, consegue editar ou cancelar antes da contratacao, e a home do Musico passa a listar oportunidades abertas vindas de dados reais.

## Entregaveis previstos

- migration inicial de `opportunities` com RLS e status de operacao
- camada mobile `features/opportunities` com queries e mutations
- tela do Bar para criar e editar vaga
- home do Bar com CTA funcional e lista das proprias vagas
- home do Musico lendo oportunidades abertas do Supabase
- atualizacao de `TASKS.md`, `BACKLOG.md`, `DATA_MODEL.md` e `ARCHITECTURE.md`

## Entregue

- migration `supabase/migrations/20260408_005_opportunities_foundation.sql` criada e aplicada no projeto Supabase
- tabela `public.opportunities` materializada com status `draft`, `open`, `closed` e `cancelled`
- politicas RLS de leitura publica autenticada para vagas abertas e operacao restrita ao proprio `venue_id`
- slice `mobile/src/features/opportunities/opportunities.ts` criado com queries e mutations para dashboard do Bar, feed do Musico e editor de vaga
- tela do Bar para criar e editar vaga adicionada em `mobile/src/features/opportunities/opportunity-editor-screen.tsx` com rotas `mobile/app/bar/opportunities/new.tsx` e `mobile/app/bar/opportunities/[id].tsx`
- `mobile/app/bar/home.tsx` atualizado para publicar, editar, cancelar e reabrir vagas reais
- `mobile/app/musician/home.tsx` atualizado para consumir oportunidades abertas do Supabase em vez do mock fixo
- `DATA_MODEL.md`, `ARCHITECTURE.md`, `TASKS.md` e `BACKLOG.md` atualizados para refletir a fundacao do marketplace

## Validacao

- `apply_migration` executado com sucesso no Supabase
- `npx.cmd tsc --noEmit`
