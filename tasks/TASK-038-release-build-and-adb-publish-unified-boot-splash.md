# TASK-038 - Publicar build release com boot unificado na splash

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-005, BKL-006

## Objetivo

Gerar uma nova build `release` com o boot unificado na splash fake, removendo a tela textual intermediaria de auth e publicando no device Android de homologacao via ADB Wi-Fi.

## Entregaveis previstos

- APK `release` atualizada com a correcao do boot
- instalacao no device `192.168.0.98:41807`
- validacao de abertura standalone sem dependencia do Metro

## Entregue

- build `release` atualizada gerada em `mobile/android/app/build/outputs/apk/release/app-release.apk`
- APK publicada no device `192.168.0.98:41807` com `adb install -r`
- app atualizado para validar a remocao da tela textual apos a splash
- bootstrap standalone mantido sem dependencia do Metro

## Validacao

- `assembleRelease` concluido com sucesso
- `adb install -r` retornou `Success`
- `logcat` continuou mostrando `ReactNativeJS: Running "main"` sem `Unable to load script` e sem `localhost:8081`
