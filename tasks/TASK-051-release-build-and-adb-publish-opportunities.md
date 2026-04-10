# TASK-051 - Publicar build release com modulo inicial de vagas via ADB Wi-Fi

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-005, BKL-018, BKL-016, BKL-017

## Objetivo

Gerar uma build `release` do app com o modulo inicial de vagas, instalar no device de homologacao e validar o bootstrap standalone sem dependencia do Metro.

## Entregaveis previstos

- APK `release` atualizada com a fundacao de oportunidades
- instalacao via ADB no device `192.168.0.98:41807`
- evidencias de bootstrap standalone e activity em foreground
- atualizacao de `TASKS.md` e `BACKLOG.md`

## Entregue

- build `release` gerada com sucesso em `mobile/android/app/build/outputs/apk/release/app-release.apk`
- APK instalada no device `192.168.0.98:41807` via `adb install -r`
- app relancado no device com `adb shell monkey -p com.tocaai.app -c android.intent.category.LAUNCHER 1`
- evidencias de runtime coletadas com `pidof com.tocaai.app` e `logcat`
- `TASKS.md` e `BACKLOG.md` atualizados com a publicacao da build

## Validacao

- `assembleRelease` concluido com sucesso
- `adb install -r` retornou `Success`
- `adb -s 192.168.0.98:41807 shell pidof com.tocaai.app` retornou PID ativo
- `adb -s 192.168.0.98:41807 logcat -d ReactNativeJS:I *:S` registrou `Running "main"`
- `adb -s 192.168.0.98:41807 logcat -d | Select-String "Unable to load script|localhost:8081"` sem ocorrencias
