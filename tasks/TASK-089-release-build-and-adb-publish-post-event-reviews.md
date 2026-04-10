# TASK-089 - Publicar build release com avaliacao bilateral pos-evento

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-005, BKL-028

## Objetivo

Gerar e publicar a build `release` com o fluxo de avaliacao bilateral pos-evento.

## Entregue

- build `release` gerada em `mobile/android/app/build/outputs/apk/release/app-release.apk`
- APK instalada via ADB Wi-Fi no device `192.168.0.98:41099`
- app relancado em `com.tocaai.app/.MainActivity` apos a instalacao

## Validacao

- `$env:NODE_ENV='production'; .\\gradlew.bat assembleRelease --no-daemon --console=plain`
- `adb connect 192.168.0.98:41099`
- `adb -s 192.168.0.98:41099 install -r C:\\Leonardo\\Labs\\TocaAI\\mobile\\android\\app\\build\\outputs\\apk\\release\\app-release.apk`
- `adb -s 192.168.0.98:41099 shell am start -W -n com.tocaai.app/.MainActivity`
- `adb -s 192.168.0.98:41099 shell dumpsys activity top | Select-String \"ACTIVITY com.tocaai.app|TASK com.tocaai.app|MainActivity\"`
- `adb -s 192.168.0.98:41099 logcat -d | Select-String \"Unable to load script|localhost:8081|ReactNativeJS|tocaai\"`
- sem ocorrencias de `Unable to load script` ou `localhost:8081`
