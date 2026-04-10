# TASK-015 - Publicar build release atual via ADB Wi-Fi

Status: DONE
Inicio: 2026-04-07
Conclusao: 2026-04-07
Backlog relacionado: BKL-005, BKL-006

## Objetivo

Gerar uma build `release` atual do app mobile e publicar o APK no dispositivo Android conectado por ADB Wi-Fi em `192.168.0.98:41807`.

## Entregaveis

- build `release` atualizada em `mobile/android/app/build/outputs/apk/release/app-release.apk`
- instalacao via `adb -s 192.168.0.98:41807 install -r`
- abertura do app no dispositivo para homologacao standalone

## Validacao

- `adb connect 192.168.0.98:41807`
- `$env:NODE_ENV='production'; .\gradlew.bat assembleRelease --no-daemon --console=plain`
- `adb -s 192.168.0.98:41807 install -r ...\app-release.apk`
- `adb -s 192.168.0.98:41807 shell am start -n com.tocaai.app/.MainActivity`
- `adb -s 192.168.0.98:41807 logcat -d | Select-String 'Unable to load script|localhost:8081|ReactNativeJS|tocaai'`

## Observacao

Esta trilha seguiu o playbook definido em `AGENTS.md`: homologacao standalone usou build `release`, o app foi instalado com sucesso no device `192.168.0.98:41807`, a activity `com.tocaai.app/.MainActivity` ficou resumida em foreground e nao houve indicio de dependencia de Metro em `localhost:8081`.
