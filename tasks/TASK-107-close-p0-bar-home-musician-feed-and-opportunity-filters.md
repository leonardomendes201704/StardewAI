# TASK-107 - Fechar P0 funcional da home do Bar, home do Musico e filtros de vaga

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado:

- BKL-016
- BKL-017
- BKL-019

## Objetivo

Fechar os gaps funcionais restantes do marketplace no shell principal, conectando a home do Bar ao fluxo real de agenda e busca ativa, e adicionando filtros reais de oportunidades para o Musico.

## Entregas

- home do Bar conectada a `agenda` real e `busca ativa` real
- substituicao dos blocos estaticos de artistas por previews vindos de `useBarArtistSearch`
- agenda em destaque no topo da home do Bar com CTA de conversa e detalhe da contratacao
- filtros reais na home do Musico por `periodo`, `regiao` e `faixa de cache`
- ranking geografico minimo do feed do Musico priorizando `cidade`, depois `estado`, depois restante
- exposicao visual do contexto geografico no card da vaga

## Resultado

Os P0 de home e listagem do marketplace deixaram de depender de placeholders ou de feed sem filtro. O fluxo agora cobre navegacao real de descoberta, shortlist operacional e detalhamento de vaga com recortes minimos de data, regiao e valor.
