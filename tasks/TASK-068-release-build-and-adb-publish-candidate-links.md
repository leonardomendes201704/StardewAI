# TASK-068 - Publicar build release com ajustes de candidatos e links externos

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-005, BKL-020, BKL-029

## Objetivo

Gerar uma nova build `release` com os refinamentos da lista de candidatos do Bar e dos links externos clicaveis no detalhe do Musico, e publicar no device oficial de homologacao.

## Entregue

- build `release` gerada em `mobile/android/app/build/outputs/apk/release/app-release.apk`
- APK instalada via ADB Wi-Fi no device `192.168.0.98:41807`
- app relancado em foreground apos a instalacao

## Validacao

- `.\gradlew.bat assembleRelease --no-daemon --console=plain`
- `adb -s 192.168.0.98:41807 install -r ...\\app-release.apk`
- `adb -s 192.168.0.98:41807 shell monkey -p com.tocaai.app -c android.intent.category.LAUNCHER 1`
- bootstrap standalone mantido sem dependencia de Metro
