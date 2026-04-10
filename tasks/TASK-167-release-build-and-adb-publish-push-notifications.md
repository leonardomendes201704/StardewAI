# TASK-167 - Publicar build release com fundacao de notificacoes push

Status: DONE
Inicio: 2026-04-09
Fim: 2026-04-09
Backlog relacionado:

- BKL-005
- BKL-032

## Objetivo

Gerar e instalar no aparelho de homologacao a nova `release` Android com a fundacao de push notifications do marketplace.

## Evidencia tecnica

- `npx.cmd tsc --noEmit` executado com sucesso em `mobile/`
- `mobile/android`: `$env:NODE_ENV='production'; .\gradlew.bat assembleRelease --no-daemon --console=plain`
- APK gerada em `mobile/android/app/build/outputs/apk/release/app-release.apk`
- `adb connect 192.168.0.98:38715`
- `adb -s 192.168.0.98:38715 install -r C:\Leonardo\Labs\TocaAI\mobile\android\app\build\outputs\apk\release\app-release.apk`
- `adb -s 192.168.0.98:38715 shell monkey -p com.tocaai.app -c android.intent.category.LAUNCHER 1`
- `dumpsys` confirmou `com.tocaai.app/.MainActivity` em foreground
- `logcat` mostrou `ReactNativeJS: Running \"main\"` sem `localhost:8081` nem `Unable to load script`

## Resultado

A nova `release` com a base de notificacoes push foi publicada no device `192.168.0.98:38715` e manteve o bootstrap standalone sem regressao nativa aparente.
