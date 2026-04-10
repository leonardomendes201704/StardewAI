# TASK-054 - Publicar build release com recorrencia semanal nas vagas

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-005, BKL-017, BKL-018

## Objetivo

Gerar uma nova build `release` com a evolucao do modulo de vagas e publicar no device Android de homologacao via ADB Wi-Fi.

## Entregaveis previstos

- `assembleRelease` concluido com a evolucao de recorrencia, duracao em horas e chips de estilo
- APK `release` instalado no device `192.168.0.98:41807`
- validacao basica de bootstrap standalone sem dependencia de Metro
- atualizacao de `TASKS.md` e `BACKLOG.md`

## Entregue

- `assembleRelease` concluido com a evolucao de recorrencia semanal, duracao em horas e estilo por chips
- APK `release` instalado no device `192.168.0.98:41807`
- `MainActivity` retomada no device apos launch via `adb shell monkey`
- logs sem indicio de dependencia de `localhost:8081` ou `Unable to load script`

## Validacao

- `npx.cmd tsc --noEmit`
- `adb -s 192.168.0.98:41807 install -r ...\\app-release.apk`
- `adb -s 192.168.0.98:41807 shell monkey -p com.tocaai.app -c android.intent.category.LAUNCHER 1`
- `adb -s 192.168.0.98:41807 shell dumpsys activity activities`
- `adb -s 192.168.0.98:41807 logcat -d`
