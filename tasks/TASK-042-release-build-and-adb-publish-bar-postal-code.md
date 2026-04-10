# TASK-042 - Publicar build release com CEP do Bar via ViaCEP

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-005, BKL-012

## Objetivo

Gerar e publicar uma nova build `release` com o perfil do Bar orientado por `CEP`, para validar no device o preenchimento automatico de logradouro, bairro, cidade e UF.

## Entregaveis previstos

- APK `release` atualizada em `mobile/android/app/build/outputs/apk/release/app-release.apk`
- instalacao via `adb install -r` no device `192.168.0.98:41807`
- verificacao basica de bootstrap standalone apos a publicacao

## Entregue

- build `release` atualizada gerada em `mobile/android/app/build/outputs/apk/release/app-release.apk`
- APK publicada no device `192.168.0.98:41807` com `adb install -r`
- app relancado no device para deixar a versao pronta para validacao do novo fluxo de endereco do Bar

## Validacao

- `assembleRelease` concluido com sucesso
- `adb install -r` retornou `Success`
- `logcat` continuou sem `Unable to load script` e sem `localhost:8081`
