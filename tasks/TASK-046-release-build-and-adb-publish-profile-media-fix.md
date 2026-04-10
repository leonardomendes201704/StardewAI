# TASK-046 - Publicar build release com fix do upload de imagem

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-005, BKL-012, BKL-014

## Objetivo

Gerar e publicar uma nova build `release` com a correcao do upload de imagem em Android release, eliminando o fluxo que disparava `Request Network Failed`.

## Entregaveis previstos

- APK `release` atualizada em `mobile/android/app/build/outputs/apk/release/app-release.apk`
- instalacao via `adb install -r` no device `192.168.0.98:41807`
- verificacao basica de bootstrap standalone apos a publicacao

## Entregue

- build `release` atualizada gerada em `mobile/android/app/build/outputs/apk/release/app-release.apk`
- APK publicada no device `192.168.0.98:41807` com `adb install -r`
- app relancado no device para reteste do upload de imagem

## Validacao

- `assembleRelease` concluido com sucesso
- `adb install -r` retornou `Success`
- `dumpsys activity` confirmou `com.tocaai.app/.MainActivity` em foreground
- sem indicio de dependencia de `localhost:8081` no bootstrap standalone
