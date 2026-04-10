# TASK-108 - Publicar build release com fechamento dos P0 remanescentes do marketplace

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado:

- BKL-005
- BKL-016
- BKL-017
- BKL-019

## Objetivo

Gerar e instalar uma nova build `release` contendo os ajustes finais dos P0 remanescentes do marketplace.

## Entregas

- `npx tsc --noEmit` validado
- `assembleRelease` executado com sucesso
- APK `release` instalada no device de homologacao via ADB Wi-Fi
- bootstrap standalone confirmado sem dependencia de `localhost:8081`

## Resultado

A trilha funcional e documental dos P0 remanescentes foi empacotada em uma build publica para validacao no aparelho.
