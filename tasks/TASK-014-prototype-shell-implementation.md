# TASK-014 - Implementar shell mobile alinhado ao prototipo

Status: DONE
Inicio: 2026-04-07
Conclusao: 2026-04-07
Backlog relacionado: BKL-006, BKL-009, BKL-016, BKL-017

## Objetivo

Refatorar o shell atual do app mobile para seguir a direcao definida em `Prototipo/` e `UI_MAP.md`, com foco inicial em onboarding, homes principais e navegacao base.

## Entregaveis

- onboarding alinhado ao prototipo
- home do Bar alinhada ao prototipo
- home do Musico alinhada ao prototipo
- navegacao base e design tokens convergindo para `electric_nightfall`
- validacao tecnica da compilacao TypeScript

## Validacao

- `npx tsc --noEmit`

## Observacao

O scaffold antigo de tabs foi removido da rota principal. O app agora abre no onboarding e expande para homes, agenda e perfil no padrao visual definido em `Prototipo/`.
