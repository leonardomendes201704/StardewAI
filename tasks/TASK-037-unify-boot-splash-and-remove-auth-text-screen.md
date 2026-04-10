# TASK-037 - Unificar boot na splash e remover tela textual de auth

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-005, BKL-006

## Objetivo

Eliminar a tela intermediaria textual que ainda aparece apos a splash, mantendo um unico fluxo de abertura baseado na splash fake ate a hidratacao de sessao terminar.

## Entregaveis previstos

- `AuthGate` sem `LoadingScreen` textual
- splash fake reutilizada durante a hidratacao de sessao
- nova build `release` instalada no device para validacao

## Entregue

- controle temporal da splash removido do `RootLayout`
- `AuthGate` passou a reutilizar `StartupSplashScreen` enquanto a sessao hidrata
- tela textual intermediaria de auth removida do fluxo normal de boot
- sequencia de abertura consolidada em uma unica splash fake antes da tela funcional seguinte

## Validacao

- `npx.cmd tsc --noEmit`
- inspeção de codigo confirmou a troca de `LoadingScreen` por `StartupSplashScreen` no `AuthGate`
