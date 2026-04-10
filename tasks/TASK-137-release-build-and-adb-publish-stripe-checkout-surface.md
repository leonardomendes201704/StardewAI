# TASK-137 - Publicar build release com surface Stripe Checkout no app

Status: DONE
Inicio: 2026-04-09
Fim: 2026-04-09
Backlog relacionado:

- BKL-005
- BKL-031
- BKL-039

## Objetivo

Gerar a `release` Android com a nova superficie de pagamentos e publicar no device de homologacao via `ADB Wi-Fi`.

## Validacao tecnica

- `npx.cmd tsc --noEmit`
- `mobile/android/gradlew.bat assembleRelease --no-daemon --console=plain`
- `adb -s 192.168.0.98:38715 install -r C:\Leonardo\Labs\TocaAI\mobile\android\app\build\outputs\apk\release\app-release.apk`
- `adb -s 192.168.0.98:38715 shell am start -n com.tocaai.app/.MainActivity`
- `dumpsys activity` com `com.tocaai.app/.MainActivity` em foreground
- `logcat` sem `localhost:8081` ou `Unable to load script`

## Resultado

A build `release` com o CTA de Checkout no lado do Bar e o resumo financeiro no lado do Musico foi instalada com sucesso no device `192.168.0.98:38715`, mantendo bootstrap standalone e `ReactNativeJS: Running "main"` sem dependencia de Metro local.
