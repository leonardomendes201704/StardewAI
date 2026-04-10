# TASK-021 - Registrar homologacao real do cadastro e confirmacao nativa

Status: DONE
Inicio: 2026-04-07
Fim: 2026-04-07
Backlog relacionado: BKL-010, BKL-012, BKL-013

## Objetivo

Registrar a homologacao funcional do fluxo real de cadastro com confirmacao por deep link nativo e verificar se os registros esperados foram materializados no Supabase.

## Entregue

- confirmacao do usuario de que o fluxo de email com deep link funcionou em device
- verificacao no Supabase de usuarios e perfis materializados apos os cadastros reais
- backlog atualizado com o estado real da homologacao de auth e perfis base

## Validacao

- `auth.users`: `2`
- `public.accounts`: `2`
- `public.accounts` por tipo: `1` bar e `1` musician
- `public.venue_profiles`: `1`
- `public.artist_profiles`: `1`

## Observacao

Esta task registra a validacao funcional do primeiro corte de cadastro real. Formularios completos de perfil, edicao e logout/reabertura seguem como trilhas separadas.
