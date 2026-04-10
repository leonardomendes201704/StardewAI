# TASK-069 - Remover chip residual de candidatura no detalhe do candidato

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-020

## Objetivo

Eliminar o chip residual `Candidatura enviada` que ainda aparecia na tela de detalhe do candidato do lado do Bar, mesmo apos a limpeza da lista.

## Entregue

- remocao do `StatusPill` da secao de contexto da candidatura no detalhe do candidato
- manutencao apenas do texto temporal `Candidatura enviada em ...`

## Validacao

- `npx.cmd tsc --noEmit`
- busca textual em `mobile/src` confirmando que o label residual nao permanece mais no detalhe do candidato
