# TASK-086 - Publicar build release com busca ativa de artistas

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-005, BKL-021

## Objetivo

Gerar e publicar a build `release` com a nova busca de artistas do lado do Bar.

## Entregue

- build `release` gerada em `mobile/android/app/build/outputs/apk/release/app-release.apk`
- APK instalada via ADB Wi-Fi no device `192.168.0.98:41099`
- app relancado em `com.tocaai.app/.MainActivity` apos a instalacao

## Validacao

- `$env:NODE_ENV='production'; .\\gradlew.bat assembleRelease --no-daemon --console=plain`
- `adb -s 192.168.0.98:41099 install -r C:\\Leonardo\\Labs\\TocaAI\\mobile\\android\\app\\build\\outputs\\apk\\release\\app-release.apk`
- `adb -s 192.168.0.98:41099 shell am start -n com.tocaai.app/.MainActivity`
- `adb -s 192.168.0.98:41099 shell dumpsys activity activities | Select-String "mResumedActivity|ResumedActivity|com.tocaai.app/.MainActivity"`
- `adb -s 192.168.0.98:41099 logcat -d | Select-String "Unable to load script|localhost:8081|ReactNativeJS|tocaai"`
- `com.tocaai.app/.MainActivity` em foreground
- sem ocorrencias de `Unable to load script` ou `localhost:8081`
