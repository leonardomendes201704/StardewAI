# TASK-047 - Homologar upload real de fotos do Bar no Supabase

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-012

## Objetivo

Confirmar no Supabase que o upload real de fotos do estabelecimento funcionou no device, incluindo persistencia das linhas em `venue_media_assets` e sincronismo da capa em `venue_profiles.cover_image_url`.

## Entregaveis previstos

- evidencias de persistencia real das fotos do Bar
- validacao do sincronismo da primeira imagem como capa
- atualizacao de `TASKS.md` e `BACKLOG.md` conforme o resultado

## Entregue

- consulta no Supabase confirmou `3` linhas reais em `public.venue_media_assets` para o perfil do Bar homologado no device
- `public.venue_profiles.cover_image_url` foi sincronizado automaticamente com a primeira imagem enviada
- `TASKS.md` e `BACKLOG.md` foram atualizados para refletir a homologacao concluida

## Validacao

- `public.venue_media_assets`: `3` registros persistidos para o `venue_id` `ef492514-c36b-4fac-bfcb-540a796c23a1`
- `sort_order`: `0`, `1` e `2`, preservando a ordem de envio
- `public.venue_profiles.cover_image_url`: preenchido com a primeira foto enviada
