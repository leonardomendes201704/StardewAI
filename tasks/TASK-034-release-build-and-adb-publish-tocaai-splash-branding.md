# TASK-034 - Publicar build release com marca TocaAI e nova splash

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado: BKL-005, BKL-006

## Objetivo

Gerar uma nova build `release` com a marca `TocaAI`, a splash atualizada com a arte fornecida pelo usuario e o loading fake de 2 segundos, publicando no device Android de homologacao via ADB Wi-Fi.

## Entregaveis previstos

- APK `release` atualizada com a nova marca
- splash nativa e splash fake alinhadas ao novo visual
- instalacao no device `192.168.0.98:41807`
- validacao de abertura standalone sem dependencia do Metro

## Entregue

- build `release` atualizada gerada em `mobile/android/app/build/outputs/apk/release/app-release.apk`
- APK publicada no device `192.168.0.98:41807` com `adb install -r`
- app relancado em `com.tocaai.app/.MainActivity`
- bootstrap standalone confirmado sem dependencia de Metro

## Validacao

- `assembleRelease` concluido com sucesso
- APK gerada com tamanho final de `38.098.590` bytes em `2026-04-08 07:42:35`
- `adb install -r` retornou `Success`
- `dumpsys activity activities` confirmou foreground em `com.tocaai.app/.MainActivity`
- `logcat` mostrou `ReactNativeJS: Running "main"` e nenhum indicio de `Unable to load script` ou `localhost:8081`
- observacao: a captura automatica via `adb shell screencap` retornou imagens pretas durante o boot, entao a confirmacao visual fina da splash no aparelho ainda depende de verificacao manual
