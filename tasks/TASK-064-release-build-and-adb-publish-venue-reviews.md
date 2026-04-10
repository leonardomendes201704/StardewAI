# TASK-064 - Publicar build release com reviews do Bar no detalhe da vaga

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-005, BKL-019, BKL-029

## Objetivo

Gerar a build `release` com score e comentarios do Bar no detalhe da vaga e publicar essa versao no device Android de homologacao via ADB Wi-Fi.

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
