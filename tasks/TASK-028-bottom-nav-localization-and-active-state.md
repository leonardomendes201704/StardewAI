# TASK-028 - Localizar bottom nav e refinar alinhamento visual

Status: DONE
Inicio: 2026-04-07
Fim: 2026-04-07
Backlog relacionado: BKL-006

## Objetivo

Refinar a barra inferior compartilhada para usar labels em PT-BR, melhorar o alinhamento entre icones e textos e destacar a aba ativa em verde neon.

## Entregaveis previstos

- labels da bottom nav em PT-BR
- melhor centralizacao visual entre icone e texto
- estado ativo em verde neon
- validacao local antes de gerar nova `release`

## Entregue

- labels da bottom nav atualizadas para `Inicio`, `Buscar`, `Agenda`, `Conversa` e `Perfil`
- alinhamento do conjunto icone + texto refinado no componente compartilhado
- estado ativo atualizado para verde neon com glow sutil e sem perder legibilidade
- comportamento aplicado de forma centralizada em `mobile/src/shared/components/navigation.tsx`

## Validacao

- `npx.cmd tsc --noEmit`
