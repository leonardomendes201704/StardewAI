# TASK-103 - Publicar build release com cancelamento e remarcacao basicos

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-005, BKL-026

## Objetivo

Gerar e instalar a build `release` com os novos fluxos de cancelamento com motivo e remarcacao de contratacao.

## Entregue

- build `release` gerada em `mobile/android/app/build/outputs/apk/release/app-release.apk`
- APK instalada via ADB Wi-Fi no device `192.168.0.98:41099`
- app relancado e confirmado em `com.tocaai.app/.MainActivity`

## Validacao

- `$env:NODE_ENV='production'; .\\gradlew.bat assembleRelease --no-daemon --console=plain`
- `adb connect 192.168.0.98:41099`
- `adb -s 192.168.0.98:41099 install -r C:\\Leonardo\\Labs\\TocaAI\\mobile\\android\\app\\build\\outputs\\apk\\release\\app-release.apk`
- `adb -s 192.168.0.98:41099 shell monkey -p com.tocaai.app -c android.intent.category.LAUNCHER 1`
- `adb -s 192.168.0.98:41099 shell dumpsys activity activities | Select-String \"mResumedActivity|ResumedActivity|com.tocaai.app/.MainActivity\"`
- `adb -s 192.168.0.98:41099 logcat -d | Select-String \"Unable to load script|localhost:8081|ReactNativeJS|tocaai\" | Select-Object -Last 20`
- `ReactNativeJS: Running \"main\"` confirmado
- sem ocorrencias de `Unable to load script` ou `localhost:8081`
