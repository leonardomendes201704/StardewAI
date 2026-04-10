# TASK-079 - Publicar build release com fix do feed apos contratacao

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-005, BKL-024, BKL-025

## Objetivo

Gerar e publicar uma nova build `release` contendo o ajuste que remove vagas com contratacao confirmada da lista de vagas do Musico.

## Entregue

- build `release` gerada em `mobile/android/app/build/outputs/apk/release/app-release.apk`
- APK instalada via ADB Wi-Fi no device `192.168.0.98:41807`
- app relancado no device com `am start` para validar a `MainActivity` apos a instalacao

## Validacao

- `$env:NODE_ENV='production'; .\gradlew.bat assembleRelease --no-daemon --console=plain`
- `adb -s 192.168.0.98:41807 install -r C:\Leonardo\Labs\TocaAI\mobile\android\app\build\outputs\apk\release\app-release.apk`
- `adb -s 192.168.0.98:41807 shell monkey -p com.tocaai.app -c android.intent.category.LAUNCHER 1`
- `adb -s 192.168.0.98:41807 shell am start -n com.tocaai.app/.MainActivity`
- `adb -s 192.168.0.98:41807 logcat -d | Select-String "Unable to load script|localhost:8081|ReactNativeJS|tocaai"`
- `ReactNativeJS: Running "main"` presente no log
- sem ocorrencias de `Unable to load script` ou `localhost:8081`
