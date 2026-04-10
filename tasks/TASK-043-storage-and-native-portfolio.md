# TASK-043 - Implementar storage e portfolio nativo para perfis

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-012, BKL-014

## Objetivo

Adicionar upload nativo de imagens para Bar e Musico com Supabase Storage, fechar a lacuna de fotos do estabelecimento e iniciar o portfolio real do artista com fotos, link de video publico e repertorio.

## Entregaveis previstos

- migration para bucket, tabelas de midia e regras de acesso no Supabase
- camada mobile para selecionar imagens no aparelho e enviar para o Storage
- perfil do Bar com galeria de fotos do ambiente em vez de depender de URL manual
- perfil do Musico com portfolio de fotos e campo de repertorio persistido
- atualizacao de `DATA_MODEL.md`, `ARCHITECTURE.md`, `TASKS.md` e `BACKLOG.md`

## Entregue

- migration `supabase/migrations/20260408_004_profile_media_storage_foundation.sql` criada e aplicada no projeto Supabase
- bucket publico `profile-media` criado com politicas de upload por pasta do proprio usuario em `storage.objects`
- tabelas `public.venue_media_assets` e `public.artist_media_assets` criadas com RLS e metadados de imagem
- `public.artist_profiles` expandida com `repertoire_summary`
- `mobile/src/features/profiles/profile-media.ts` criado para selecao nativa com `expo-image-picker`, upload para o Storage e remocao de imagens
- `mobile/src/features/profiles/profile-editor.ts` atualizado para consultar `mediaAssets`, salvar repertorio do Musico e deixar a capa do Bar sincronizada por trigger
- `mobile/app/bar/profile.tsx` convertido para galeria real de fotos do ambiente, removendo a dependencia de URL manual
- `mobile/app/musician/profile.tsx` atualizado com portfolio visual, repertorio persistido e hero dinamico a partir da primeira imagem enviada
- `DATA_MODEL.md` e `ARCHITECTURE.md` atualizados com a fundacao de storage e portfolio

## Validacao

- `npx.cmd tsc --noEmit`
- `apply_migration` executado com sucesso no Supabase
- `list_tables` confirmou `venue_media_assets`, `artist_media_assets` e `artist_profiles.repertoire_summary`
- `list_storage_buckets` confirmou o bucket `profile-media`
