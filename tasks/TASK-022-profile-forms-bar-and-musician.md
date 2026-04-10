# TASK-022 - Implementar formularios de perfil para Bar e Musico

Status: DONE
Inicio: 2026-04-07
Fim: 2026-04-07
Backlog relacionado: BKL-012, BKL-013

## Objetivo

Transformar as telas de perfil atuais em formularios editaveis conectados ao Supabase para que Bar e Musico consigam completar os dados principais do MVP.

## Entregaveis previstos

- camada de dados para ler e salvar perfis de `venue_profiles` e `artist_profiles`
- formulario do Bar com dados de casa, endereco, dias e bio
- formulario do Musico com dados artistico-comerciais, genero, raio e links
- atualizacao de `accounts.display_name`, `profile_completed` e `onboarding_completed`
- rastreabilidade atualizada em task e backlog

## Entregue

- camada de dados criada em `mobile/src/features/profiles/profile-editor.ts`
- `mobile/app/bar/profile.tsx` transformada em formulario real de perfil do estabelecimento
- `mobile/app/musician/profile.tsx` transformada em formulario real de perfil do artista mantendo a direcao visual do prototipo
- `InputField` atualizado para suportar multiline e `containerStyle`
- sincronizacao de `accounts.display_name`, `profile_completed` e `onboarding_completed` ligada ao save dos perfis

## Validacao

- `npx.cmd tsc --noEmit`
