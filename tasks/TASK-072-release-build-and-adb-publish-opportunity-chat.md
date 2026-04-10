# TASK-072 - Publicar build release com chat contextual por candidatura

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-005, BKL-023

## Objetivo

Gerar e publicar uma nova build `release` contendo a inbox e o detalhe da conversa contextual da candidatura.

## Entregue

- build `release` gerada em `mobile/android/app/build/outputs/apk/release/app-release.apk`
- APK instalada via ADB Wi-Fi no device `192.168.0.98:41807`
- app relancado apos a instalacao para validar bootstrap standalone

## Validacao

- `.\gradlew.bat assembleRelease --no-daemon --console=plain`
- `adb -s 192.168.0.98:41807 install -r ...\\app-release.apk`
- `adb -s 192.168.0.98:41807 shell monkey -p com.tocaai.app -c android.intent.category.LAUNCHER 1`
