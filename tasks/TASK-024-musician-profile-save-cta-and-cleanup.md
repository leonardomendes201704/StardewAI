# TASK-024 - Corrigir CTA de salvamento e residuos visuais no perfil do Musico

Status: DONE
Inicio: 2026-04-07
Fim: 2026-04-07
Backlog relacionado: BKL-013

## Objetivo

Ajustar a tela de perfil do Musico para remover residuos do prototipo e deixar o CTA de salvamento claramente acessivel durante a edicao.

## Entregaveis previstos

- remocao do bloco residual de `Preview de palco`
- eliminacao do texto tecnico nao previsto na UI final
- CTA fixo de `Salvar perfil do Musico` acima da bottom nav
- nova validacao local e preparacao para publicar uma `release` corrigida

## Entregue

- bloco de preview residual removido de `mobile/app/musician/profile.tsx`
- texto de referencia ao prototipo removido da UI final
- CTA de `Salvar perfil do Musico` movido para uma faixa fixa acima da bottom nav
- card final simplificado para contexto da conta, sem linguagem tecnica exposta ao usuario

## Validacao

- `npx.cmd tsc --noEmit`
