# TASK-061 - Exibir carrossel de fotos do Bar no detalhe da vaga

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-019, BKL-012, BKL-017

## Objetivo

Evoluir o detalhe da vaga do Musico para exibir as fotos reais do estabelecimento em formato de carrossel, com abertura em tela cheia ao tocar na imagem.

## Entregue

- query de detalhe da vaga ampliada para carregar `venue_media_assets`
- novo carrossel horizontal de fotos da casa no detalhe da vaga
- indicadores visuais da posicao atual no carrossel
- viewer em tela cheia com navegacao horizontal entre as fotos
- correcao do separador textual do cabeçalho da casa contratante
- atualizacao de `TASKS.md` e `BACKLOG.md`

## Validacao

- `npx.cmd tsc --noEmit`
