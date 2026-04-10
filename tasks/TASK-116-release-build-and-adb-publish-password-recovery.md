# TASK-116 - Publicar build release com recuperacao de acesso

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado:

- BKL-005
- BKL-011

## Objetivo

Gerar e publicar no device a build `release` com o novo fluxo de recuperacao de acesso por email e redefinicao de senha.

## Validacao tecnica

- `npx.cmd tsc --noEmit`
- `mobile/android`: `$env:NODE_ENV='production'; .\gradlew.bat assembleRelease --no-daemon --console=plain`
- `adb connect 192.168.0.98:41099`
- `adb -s 192.168.0.98:41099 install -r C:\Leonardo\Labs\TocaAI\mobile\android\app\build\outputs\apk\release\app-release.apk`
- `adb -s 192.168.0.98:41099 shell am start -n com.tocaai.app/.MainActivity`
- `dumpsys` confirmou `com.tocaai.app/.MainActivity` como `ResumedActivity` e `mFocusedApp`
- `logcat` mostrou `ReactNativeJS: Running "main"` e nao mostrou `localhost:8081` nem `Unable to load script`

## Resultado

A build `release` com recuperacao de acesso e redefinicao de senha foi publicada com sucesso no device `192.168.0.98:41099`, pronta para homologacao funcional de `BKL-011`.
