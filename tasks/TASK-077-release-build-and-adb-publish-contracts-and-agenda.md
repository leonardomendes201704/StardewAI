# TASK-077 - Publicar build release com contratacao e agenda simples

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-005, BKL-024, BKL-025

## Objetivo

Gerar e publicar uma nova build `release` com o fluxo de contratacao e as agendas simples conectadas ao backend.

## Entregue

- build `release` gerada em `mobile/android/app/build/outputs/apk/release/app-release.apk`
- APK instalada via ADB Wi-Fi no device `192.168.0.98:41807`
- app relancado apos a instalacao para validar bootstrap standalone e foreground

## Validacao

- `.\gradlew.bat assembleRelease --no-daemon --console=plain`
- `adb -s 192.168.0.98:41807 install -r ...\\app-release.apk`
- `adb -s 192.168.0.98:41807 shell monkey -p com.tocaai.app -c android.intent.category.LAUNCHER 1`
- `adb -s 192.168.0.98:41807 shell dumpsys activity activities | findstr "com.tocaai.app"`
- `adb -s 192.168.0.98:41807 logcat -d ReactNativeJS:I *:S`
- sem ocorrencias de `Unable to load script` ou `localhost:8081`
