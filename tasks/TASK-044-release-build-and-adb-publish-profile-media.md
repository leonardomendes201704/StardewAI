# TASK-044 - Publicar build release com upload nativo de midia e portfolio

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-005, BKL-012, BKL-014

## Objetivo

Gerar e publicar uma nova build `release` com upload nativo de imagens para Bar e Musico, portfolio visual do artista e repertorio persistido.

## Entregaveis previstos

- APK `release` atualizada em `mobile/android/app/build/outputs/apk/release/app-release.apk`
- instalacao via `adb install -r` no device `192.168.0.98:41807`
- verificacao basica de bootstrap standalone apos a publicacao

## Entregue

- build `release` atualizada gerada em `mobile/android/app/build/outputs/apk/release/app-release.apk`
- APK publicada no device `192.168.0.98:41807` com `adb install -r`
- app relancado no device para deixar a versao pronta para validacao do upload nativo de midia e do portfolio

## Validacao

- `assembleRelease` concluido com sucesso
- `adb install -r` retornou `Success`
- `dumpsys activity` confirmou `com.tocaai.app/.MainActivity` em foco
- `logcat` mostrou `ReactNativeJS: Running "main"` e nao mostrou `Unable to load script` nem `localhost:8081`
