# TASK-146 - Publicar build release com trilha diagnostica do Checkout Stripe

Status: DONE
Inicio: 2026-04-09
Fim: 2026-04-09
Backlog relacionado:

- BKL-005
- BKL-031
- BKL-039

## Objetivo

Gerar a `release` Android com o diagnostico por etapas do Checkout Stripe e reinstalar no device de homologacao.

## Validacao tecnica

- `npx.cmd tsc --noEmit`
- `mobile/android/gradlew.bat assembleRelease --no-daemon --console=plain`
- `adb -s 192.168.0.98:38715 install -r C:\Leonardo\Labs\TocaAI\mobile\android\app\build\outputs\apk\release\app-release.apk`
- `adb -s 192.168.0.98:38715 shell monkey -p com.tocaai.app -c android.intent.category.LAUNCHER 1`
- `dumpsys activity` com `com.tocaai.app/.MainActivity` em foreground

## Resultado

A build `release` com o diagnostico por etapas do Checkout Stripe foi instalada com sucesso no device `192.168.0.98:38715` e ficou pronta para novo reteste funcional.
