# TASK-113 - Publicar build release com sinais publicos de confianca no marketplace

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado:

- BKL-005
- BKL-030

## Objetivo

Gerar a build `release` com os novos sinais publicos de confianca, publicar no device de homologacao e confirmar que o app continua subindo standalone.

## Validacao tecnica

- `npx.cmd tsc --noEmit`
- `mobile/android`: `$env:NODE_ENV='production'; .\gradlew.bat assembleRelease --no-daemon --console=plain`
- `adb connect 192.168.0.98:41099`
- `adb -s 192.168.0.98:41099 install -r C:\Leonardo\Labs\TocaAI\mobile\android\app\build\outputs\apk\release\app-release.apk`
- `adb -s 192.168.0.98:41099 shell monkey -p com.tocaai.app -c android.intent.category.LAUNCHER 1`
- `dumpsys` confirmou `com.tocaai.app/.MainActivity` como `ResumedActivity` e `mFocusedApp`
- `logcat` mostrou `ReactNativeJS: Running "main"` e nao mostrou `localhost:8081` nem `Unable to load script`

## Resultado

A build `release` com sinais minimos de confianca nas superficies publicas do marketplace foi publicada com sucesso no device `192.168.0.98:41099`, pronta para homologacao visual de `BKL-030`.
