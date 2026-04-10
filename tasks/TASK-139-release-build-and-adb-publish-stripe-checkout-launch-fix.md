# TASK-139 - Publicar build release com fix de abertura do Checkout Stripe

Status: DONE
Inicio: 2026-04-09
Fim: 2026-04-09
Backlog relacionado:

- BKL-005
- BKL-031
- BKL-039

## Objetivo

Gerar a `release` Android com o fix de abertura do Checkout Stripe e reinstalar no device de homologacao via `ADB Wi-Fi`.

## Validacao tecnica

- `npx.cmd tsc --noEmit`
- `mobile/android/gradlew.bat assembleRelease --no-daemon --console=plain`
- `adb -s 192.168.0.98:38715 install -r C:\Leonardo\Labs\TocaAI\mobile\android\app\build\outputs\apk\release\app-release.apk`
- `adb -s 192.168.0.98:38715 shell monkey -p com.tocaai.app -c android.intent.category.LAUNCHER 1`
- `dumpsys activity` com `com.tocaai.app/.MainActivity` em foreground
- `logcat` sem `localhost:8081` ou `Unable to load script`

## Resultado

A build `release` com o fix de abertura do Checkout Stripe foi instalada com sucesso no device `192.168.0.98:38715`. O app voltou com `com.tocaai.app/.MainActivity` em foreground e manteve bootstrap standalone sem dependencia de Metro local.
