# TASK-017 - Criar schema inicial do Supabase e persistencia do cadastro

Status: DONE
Inicio: 2026-04-07
Fim: 2026-04-07
Backlog relacionado: BKL-010, BKL-012, BKL-013

## Objetivo

Criar o schema inicial do app no Supabase para que o cadastro de Bar e Musico deixe rastros reais no banco e permita validar a base de perfis do MVP.

## Entregaveis previstos

- `DATA_MODEL.md` com entidades e relacoes iniciais
- migration SQL versionada no repositorio
- tabelas iniciais de contas e perfis no `public`
- trigger em `auth.users` para materializar `accounts` e o perfil base
- politicas RLS minimas para leitura e escrita dos proprios registros

## Entregue

- `DATA_MODEL.md` criado com entidades, relacoes e politicas iniciais
- migration versionada em `supabase/migrations/20260407_001_initial_identity_profiles.sql`
- schema inicial aplicado no projeto Supabase com tabelas `accounts`, `venue_profiles`, `artist_profiles`, `genres` e `artist_genres`
- trigger em `auth.users` para criar conta e perfil base conforme `account_type`
- RLS habilitado em todas as tabelas publicas criadas
- leitura minima do registro persistido ligada nas telas de perfil do app

## Validacao

- `npx tsc --noEmit`
- `public.accounts`, `public.venue_profiles`, `public.artist_profiles`, `public.genres` e `public.artist_genres` presentes no projeto
- seed inicial de `10` generos confirmado no Supabase
- `security advisors` sem lints ativos apos a migration

## Observacao

Esta task fecha o primeiro corte de banco necessario para validar cadastro real antes de entrar nos formularios completos de perfil.
