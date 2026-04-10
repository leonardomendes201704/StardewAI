# TASK-059 - Publicar build release com detalhe e candidatura de vagas

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-005, BKL-017, BKL-019, BKL-020

## Objetivo

Gerar a build `release` com o fluxo de detalhe da vaga e candidatura do Musico e instalar no device Android de homologacao via ADB Wi-Fi.

## Entregaveis previstos

- `app-release.apk` atualizado com detalhe da vaga e candidatura
- instalacao via `adb -s 192.168.0.98:41807 install -r`
- atualizacao de `TASKS.md` e `BACKLOG.md`

## Entregue

- build `release` gerada em `mobile/android/app/build/outputs/apk/release/app-release.apk`
- instalacao no device `192.168.0.98:41807` com `adb install -r`
- relancamento do app com `adb shell monkey`
- verificacao de `com.tocaai.app/.MainActivity` em foreground
- validacao de bootstrap standalone sem `localhost:8081`
- atualizacao de `TASKS.md` e `BACKLOG.md`

## Validacao

- `assembleRelease --no-daemon --console=plain`
- `adb -s 192.168.0.98:41807 install -r`
- `adb -s 192.168.0.98:41807 shell monkey -p com.tocaai.app -c android.intent.category.LAUNCHER 1`
- `adb -s 192.168.0.98:41807 shell dumpsys activity activities`
- `adb -s 192.168.0.98:41807 logcat -d`
