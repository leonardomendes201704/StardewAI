# TASK-120 - Implementar lembretes operacionais in-app

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado:

- BKL-027

## Objetivo

Adicionar lembretes simples dentro do app, sem push, para destacar confirmacoes pendentes e shows proximos com checklist minimo de alinhamento operacional.

## Escopo

- derivacao de lembretes a partir dos contratos ativos
- cards compartilhados de lembrete com CTA para detalhe e conversa
- integracao na home do Bar
- integracao na home do Musico
- integracao nas agendas de Bar e Musico

## Resultado esperado

O usuario ve no app, com prioridade visual, shows que ainda exigem confirmacao ou que estao proximos, junto com um checklist operacional basico para reduzir desencontro antes do evento.

## Resultado

Foi criada uma camada de lembretes em `mobile/src/features/contracts/contracts.ts`, com tipos e regras para `confirmacao pendente`, `show nesta semana`, `show nas proximas 48h` e `show de hoje`. Os cards compartilhados entraram em `mobile/src/features/contracts/operational-reminder-card.tsx` e foram conectados nas homes e agendas de Bar e Musico, sempre com atalhos para o detalhe da contratacao e para a conversa contextual.
