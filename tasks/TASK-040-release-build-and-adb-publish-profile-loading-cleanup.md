# TASK-040 - Publicar build release com limpeza do loading textual no boot

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-005, BKL-006

## Objetivo

Gerar e publicar uma nova build `release` com a remocao das telas full-screen de carregamento textual nos perfis, para validar no device a sequencia de abertura sem a string `TocaAI` apos a splash.

## Entregaveis previstos

- APK `release` atualizada em `mobile/android/app/build/outputs/apk/release/app-release.apk`
- instalacao via `adb install -r` no device `192.168.0.98:41807`
- verificacao basica de bootstrap standalone apos a publicacao

## Entregue

- build `release` atualizada gerada em `mobile/android/app/build/outputs/apk/release/app-release.apk`
- APK publicada no device `192.168.0.98:41807` com `adb install -r`
- cold start executado apos `force-stop`, com `logcat` e dump de UI para checar a abertura

## Validacao

- `assembleRelease` concluido com sucesso
- `adb install -r` retornou `Success`
- `logcat` mostrou `ReactNativeJS: Running "main"` sem `Unable to load script` e sem `localhost:8081`
- `uiautomator dump` apos o cold start caiu direto em tela funcional sem a string centralizada `TocaAI`
