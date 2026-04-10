# TASK-149 - Publicar build release com ajuste de taxa e horario da retencao

Status: DONE
Inicio: 2026-04-09
Fim: 2026-04-09
Backlog relacionado:

- BKL-005
- BKL-031
- BKL-039

## Objetivo

Gerar e instalar uma nova `release` Android com os ajustes visuais e operacionais da camada de pagamento.

## Evidencia tecnica

- `npx.cmd tsc --noEmit` executado com sucesso
- `assembleRelease` concluido com sucesso
- APK gerada em `mobile/android/app/build/outputs/apk/release/app-release.apk`
- `adb -s 192.168.0.98:38715 install -r ...` retornou `Success`
- `com.tocaai.app` relancado no device apos a instalacao

## Resultado

A nova `release` com `Taxa da plataforma (%)` e com a retencao financeira alinhada ao horario local do evento ficou publicada no aparelho de homologacao.
