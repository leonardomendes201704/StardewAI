# TASK-073 - Explicitar atalhos de conversa no fluxo de candidatura

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-023

## Objetivo

Remover a ambiguidade de navegacao do chat, adicionando pontos de entrada evidentes no fluxo de candidatura para Musico e Bar.

## Entregue

- CTA `Abrir conversa` na home do Musico quando a vaga ja tem candidatura
- CTA `Conversar` direto na lista de candidatos do Bar
- ajuste no feed do Musico para carregar tambem `applicationId`, permitindo abrir a thread correta

## Validacao

- `npx.cmd tsc --noEmit`
- busca textual confirmando os novos CTAs em `mobile/app/musician/home.tsx` e `mobile/src/features/opportunities/bar-opportunity-candidates-screen.tsx`
