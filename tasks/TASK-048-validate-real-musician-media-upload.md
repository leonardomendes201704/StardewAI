# TASK-048 - Homologar upload real de fotos do Musico no Supabase

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-014

## Objetivo

Confirmar no Supabase que o upload real de fotos do portfolio do Musico funcionou no device, incluindo persistencia das linhas em `artist_media_assets`.

## Entregaveis previstos

- evidencias de persistencia real das fotos do Musico
- validacao da quantidade de itens enviados ao portfolio
- atualizacao de `TASKS.md` e `BACKLOG.md` conforme o resultado

## Entregue

- consulta no Supabase confirmou `2` linhas reais em `public.artist_media_assets` para o perfil do Musico homologado no device
- a primeira imagem publicada passou a alimentar o hero visual do perfil no app, via leitura do primeiro item da galeria
- `TASKS.md` e `BACKLOG.md` foram atualizados para refletir a homologacao parcial do item

## Validacao

- `public.artist_media_assets`: `2` registros persistidos para o `artist_id` `f1224185-bcef-4ad7-b1d1-176eaef78b98`
- `sort_order`: `0` e `1`, preservando a ordem de envio
- `public.artist_profiles.youtube_url`: `null`
- `public.artist_profiles.repertoire_summary`: `null`
