# TASK-036 - Publicar build release com correcao da sequencia de abertura

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-005, BKL-006

## Objetivo

Gerar uma nova build `release` com a sequencia de abertura simplificada, publicando no device Android de homologacao via ADB Wi-Fi para validar a remocao da splash circular e da redundancia visual antes do onboarding.

## Entregaveis previstos

- APK `release` atualizada com a nova sequencia de abertura
- instalacao no device `192.168.0.98:41807`
- validacao de abertura standalone sem dependencia do Metro
- registro da homologacao em task e backlog

## Entregue

- build `release` atualizada gerada em `mobile/android/app/build/outputs/apk/release/app-release.apk`
- APK publicada no device `192.168.0.98:41807` com `adb install -r`
- app relancado para verificacao do boot
- bootstrap standalone mantido sem dependencia do Metro

## Validacao

- `assembleRelease` concluido com sucesso
- APK gerada com tamanho final de `38.099.178` bytes em `2026-04-08 07:52:13`
- `adb install -r` retornou `Success`
- `logcat` mostrou `ReactNativeJS: Running "main"` e nenhum indicio de `Unable to load script` ou `localhost:8081`
- observacao: a automacao de UI do device caiu duas vezes no `launcher` da Motorola durante a inspecao de boot, entao a confirmacao visual da remocao do splash circular depende da verificacao manual no aparelho
