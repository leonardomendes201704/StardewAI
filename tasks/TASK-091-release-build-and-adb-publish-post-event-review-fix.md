# TASK-091 - Publicar build release com fix da avaliacao pos-evento

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-005, BKL-028

## Objetivo

Gerar e publicar a build `release` com a correcao do salvamento da avaliacao pos-evento.

## Entregue

- build `release` regenerada em `mobile/android/app/build/outputs/apk/release/app-release.apk`
- APK reinstalada via ADB Wi-Fi no device `192.168.0.98:41099`
- app relancado em `com.tocaai.app/.MainActivity`

## Validacao

- `$env:NODE_ENV='production'; .\\gradlew.bat assembleRelease --no-daemon --console=plain`
- `adb -s 192.168.0.98:41099 install -r C:\\Leonardo\\Labs\\TocaAI\\mobile\\android\\app\\build\\outputs\\apk\\release\\app-release.apk`
- `adb -s 192.168.0.98:41099 shell am start -W -n com.tocaai.app/.MainActivity`
- `adb -s 192.168.0.98:41099 logcat -d | Select-String \"Unable to load script|localhost:8081|ReactNativeJS|tocaai\"`
