# TASK-056 - Publicar build release com fix de edicao e estilos multiplos nas vagas

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-005, BKL-017, BKL-018

## Objetivo

Gerar e publicar uma nova build `release` contendo a correcao de edicao de vagas e o suporte a estilos musicais multiplos.

## Entregaveis previstos

- `assembleRelease` concluido
- APK `release` instalado no device `192.168.0.98:41807`
- validacao basica de bootstrap standalone sem dependencia de Metro
- atualizacao de `TASKS.md` e `BACKLOG.md`

## Entregue

- `assembleRelease` concluido com a correcao de edicao de vagas e o suporte a estilos multiplos
- APK `release` instalado no device `192.168.0.98:41807`
- `MainActivity` retomada no device apos launch via `adb shell monkey`
- logs sem indicio de dependencia de `localhost:8081` ou `Unable to load script`
- schema do Supabase confirmado com `music_genres`, `duration_hours` e `recurrence_days`

## Validacao

- `npx.cmd tsc --noEmit`
- `adb -s 192.168.0.98:41807 install -r ...\\app-release.apk`
- `adb -s 192.168.0.98:41807 shell monkey -p com.tocaai.app -c android.intent.category.LAUNCHER 1`
- `adb -s 192.168.0.98:41807 shell dumpsys activity activities`
- consulta SQL em `information_schema.columns`
