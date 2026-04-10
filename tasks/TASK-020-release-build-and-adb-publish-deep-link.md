# TASK-020 - Publicar build release com callback de confirmacao por deep link

Status: DONE
Inicio: 2026-04-07
Fim: 2026-04-07
Backlog relacionado: BKL-005, BKL-010

## Objetivo

Gerar uma nova build `release` com o fluxo de confirmacao por deep link e publicar no device Android de homologacao via ADB Wi-Fi.

## Entregaveis previstos

- APK `release` atualizado com callback nativo de auth
- instalacao no device `192.168.0.98:41807`
- abertura do app sem dependencia do Metro
- registro da operacao em task e backlog

## Entregue

- build `release` atualizada gerada em `mobile/android/app/build/outputs/apk/release/app-release.apk`
- APK publicado no device `192.168.0.98:41807` com `adb install -r`
- app aberto via `am start -n com.tocaai.app/.MainActivity`
- callback `tocaai://auth/callback` entregue ao app via `adb shell am start -a VIEW -d ...`
- operacao registrada em task e backlog

## Validacao

- `assembleRelease` concluido com sucesso
- APK gerado com tamanho final de `31.756.626` bytes
- `adb install -r` retornou `Success`
- `dumpsys activity activities` confirmou foreground em `com.tocaai.app/.MainActivity`
- `logcat` sem `Unable to load script` e sem `localhost:8081`
- teste sintetico de deep link retornou `Status: ok` com intent entregue ao `MainActivity`
