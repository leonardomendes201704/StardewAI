# TASK-127 - Publicar build release com observabilidade e telemetria

Status: DONE
Inicio: 2026-04-09
Fim: 2026-04-09
Backlog relacionado:

- BKL-005
- BKL-008

## Objetivo

Gerar e publicar no device a build `release` com a nova camada de observabilidade e telemetria do MVP.

## Validacao tecnica

- `npx.cmd tsc --noEmit`
- `mobile/android`: `$env:NODE_ENV='production'; .\gradlew.bat assembleRelease --no-daemon --console=plain`
- `adb connect 192.168.0.98:41099`
- `adb -s 192.168.0.98:41099 install -r C:\Leonardo\Labs\TocaAI\mobile\android\app\build\outputs\apk\release\app-release.apk`
- `adb -s 192.168.0.98:41099 shell am start -n com.tocaai.app/.MainActivity`

## Resultado esperado

A release publicada no aparelho deve conter a instrumentacao de runtime, sem regressao de bootstrap standalone.

## Resultado

A build `release` foi gerada com sucesso em `mobile/android/app/build/outputs/apk/release/app-release.apk`, instalada no device `192.168.0.98:38715` com `adb install -r` e relancada via `am start -n com.tocaai.app/.MainActivity`. O `dumpsys` confirmou `com.tocaai.app/.MainActivity` em foreground e o `logcat` mostrou bootstrap normal do app, sem `localhost:8081` nem `Unable to load script`.
