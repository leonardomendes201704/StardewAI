# TASK-035 - Simplificar sequencia de abertura e reduzir redundancia visual

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-005, BKL-006

## Objetivo

Remover a sensacao de multiplas splash screens na abertura do app, escondendo o icone circular do splash nativo e reduzindo a semelhanca do onboarding com uma terceira tela de loading.

## Entregaveis previstos

- splash nativa sem icone circular visivel
- permanencia da splash fake com a arte grande e loading de `2` segundos
- onboarding ajustado para entrar como tela funcional, nao como terceira splash
- nova build `release` instalada no device para validacao

## Entregue

- tema nativo do Android atualizado para usar `windowSplashScreenAnimatedIcon` transparente em vez da imagem circular anterior
- splash fake mantida com a arte grande e a barra de loading de `2` segundos
- hero do onboarding refeito para entrar com contexto funcional (`Marketplace musical` e `Escolha como voce entra no app`) no lugar do branding repetido
- sequencia de abertura preparada para reduzir a leitura de "tres telas seguidas"

## Validacao

- `npx.cmd tsc --noEmit`
- `rg` confirmou a troca do hero textual do onboarding
