# TASK-032 - Homologar sessao e persistencia real de perfis

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-010, BKL-012, BKL-013

## Objetivo

Executar a homologacao funcional de `logout`, reentrada, restauracao de sessao e salvamento real dos perfis de `Bar` e `Musico`, conferindo os reflexos no Supabase.

## Entregaveis previstos

- evidencia funcional de saida e reentrada no app
- evidencia de restauracao de sessao entre aberturas do app
- validacao de persistencia do perfil de `Bar` em `venue_profiles`
- validacao de persistencia do perfil de `Musico` em `artist_profiles` e `artist_genres`
- reflexo do resultado em `TASKS.md` e `BACKLOG.md`

## Andamento atual

- restauracao de sessao validada de forma nao destrutiva no device: apos `force-stop` e relancamento, o app voltou autenticado para a home do Musico
- perfil do Musico confirmado no Supabase com `stage_name`, `artist_category`, `postal_code`, `city`, `state`, `performance_radius_km`, `base_cache_cents` e genero vinculado em `artist_genres`
- UI do perfil do Musico confirmou os valores persistidos, incluindo `CEP` mascarado, `Cidade` e `UF` bloqueados, CTA fixo de salvar e acao `Sair da conta`
- perfil do `Bar` ainda esta apenas materializado na linha base de `venue_profiles`, sem dados preenchidos alem da criacao automatica

## Entregue

- fluxo de `logout`, reentrada e restauracao de sessao homologado em conjunto com o usuario no device
- conta `Bar` confirmada no Supabase com `display_name`, `profile_completed` e `onboarding_completed` ativos
- `venue_profiles` confirmado com dados persistidos de `venue_name`, `city`, `state`, `venue_type`, `performance_days`, `capacity`, `neighborhood`, `address_text` e `cover_image_url`
- conta `Musico` confirmada no Supabase com `profile_completed` e `onboarding_completed` ativos
- `artist_profiles` e `artist_genres` confirmados com persistencia real no projeto Supabase

## Validacao

- `select` em `public.accounts` confirmou `2` contas com `profile_completed = true` e `onboarding_completed = true`
- `select` em `public.venue_profiles` confirmou o salvamento funcional do perfil de `Bar`
- `select` em `public.artist_profiles` confirmou o salvamento funcional do perfil de `Musico`
- `select` em `public.artist_genres` confirmou ao menos `1` genero vinculado ao Musico
- `force-stop` seguido de relancamento do app manteve `com.tocaai.app/.MainActivity` em foreground, sem retorno ao onboarding
