# TASK-070 - Publicar build release com remocao do chip residual de candidatura

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-005, BKL-020

## Objetivo

Gerar nova build `release` e reinstalar no device oficial apos a remocao do chip residual de candidatura na tela de detalhe do candidato.

## Entregue

- build `release` gerada em `mobile/android/app/build/outputs/apk/release/app-release.apk`
- APK reinstalada no device `192.168.0.98:41807`
- app relancado em foreground apos a instalacao

## Validacao

- `.\gradlew.bat assembleRelease --no-daemon --console=plain`
- `adb -s 192.168.0.98:41807 install -r ...\\app-release.apk`
- `adb -s 192.168.0.98:41807 shell monkey -p com.tocaai.app -c android.intent.category.LAUNCHER 1`
