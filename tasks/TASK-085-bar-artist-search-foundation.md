# TASK-085 - Implementar busca ativa de artistas pelo Bar

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-021

## Objetivo

Entregar a fundacao funcional da busca ativa de artistas pelo Bar, com filtros essenciais e abertura do perfil completo do Musico.

## Entregue

- camada de dados de busca publica em `mobile/src/features/search/bar-artist-search.ts`
- tela de busca do Bar em `mobile/src/features/search/bar-artist-search-screen.tsx`
- detalhe publico do artista em `mobile/src/features/search/bar-artist-detail-screen.tsx`
- rota dedicada do detalhe em `mobile/app/bar/artists/[artistId].tsx`
- rota `/search` atualizada para abrir a busca real quando a conta e `Bar`
- filtros por:
  - regiao (`Minha cidade`, `Meu estado`, `Todos`)
  - estilo musical
  - categoria artistica
  - faixa de cache
- cards com score, generos, cidade/UF, raio e abertura do perfil completo

## Validacao

- `npx.cmd tsc --noEmit`
- revisao funcional do fluxo `Bar -> /search -> perfil do artista`

## Observacao

- a busca do lado do Musico continua fora desta task
- o convite direto ainda nao entra aqui; ele fica para a proxima trilha do backlog
