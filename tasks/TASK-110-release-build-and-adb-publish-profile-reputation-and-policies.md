# TASK-110 - Publicar build release com reputacao dedicada nos perfis e politicas operacionais consolidadas

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado:

- BKL-005
- BKL-015
- BKL-026
- BKL-029

## Objetivo

Gerar uma nova build `release`, publicar no device de homologacao e confirmar que o app continua subindo standalone com a nova camada de reputacao dedicada nos perfis.

## Validacao tecnica

- `npx.cmd tsc --noEmit`
- `mobile/android`: `$env:NODE_ENV='production'; .\gradlew.bat assembleRelease --no-daemon --console=plain`
- `adb connect 192.168.0.98:41099`
- `adb -s 192.168.0.98:41099 install -r C:\Leonardo\Labs\TocaAI\mobile\android\app\build\outputs\apk\release\app-release.apk`
- `adb -s 192.168.0.98:41099 shell am start -n com.tocaai.app/.MainActivity`
- `dumpsys` confirmou `com.tocaai.app/.MainActivity` como `ResumedActivity` e `mFocusedApp`
- `logcat` nao mostrou `localhost:8081` nem `Unable to load script`

## Resultado

A build `release` atualizada com reputacao dedicada nos perfis, selos basicos e documentacao operacional consolidada foi publicada com sucesso no device `192.168.0.98:41099`, pronta para homologacao funcional.
