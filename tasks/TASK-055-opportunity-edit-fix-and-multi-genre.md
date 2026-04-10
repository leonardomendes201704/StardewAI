# TASK-055 - Corrigir edicao de vaga e suportar estilos multiplos

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-018, BKL-017

## Objetivo

Corrigir a falha de salvamento ao editar vagas existentes e evoluir o modelo para permitir selecao multipla de estilos musicais no editor e nas homes do marketplace.

## Entregaveis previstos

- correcao do parse de data no carregamento de vagas em edicao
- tratamento de erro com mensagem real do backend quando disponivel
- migration de `music_genre` para `music_genres`
- editor do Bar com selecao multipla de estilos por chips
- homes do Bar e do Musico exibindo multiplos estilos por vaga
- atualizacao de `TASKS.md`, `BACKLOG.md`, `DATA_MODEL.md` e `ARCHITECTURE.md`

## Entregue

- migration `20260408_007_opportunities_multi_genre.sql` com transicao de `music_genre` para `music_genres`
- editor do Bar corrigido para carregar datas existentes em `DD/MM/AAAA` sem corromper o valor salvo
- tratamento de erro do save agora aproveita a mensagem retornada pelo backend quando existir
- selecao multipla de estilos musicais por chips no editor de vagas
- homes do Bar e do Musico atualizadas para exibir multiplos estilos por vaga
- atualizacao de `TASKS.md`, `BACKLOG.md`, `DATA_MODEL.md` e `ARCHITECTURE.md`

## Validacao

- `npx.cmd tsc --noEmit`
- migration aplicada com sucesso no Supabase
