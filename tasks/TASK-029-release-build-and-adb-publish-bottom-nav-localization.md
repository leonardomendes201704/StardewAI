# TASK-029 - Publicar build release com refinamentos na bottom nav

Status: DONE
Inicio: 2026-04-07
Fim: 2026-04-07
Backlog relacionado: BKL-005, BKL-006

## Objetivo

Gerar uma nova build `release` com a bottom nav localizada e refinada visualmente, e publicar no device Android de homologacao via ADB Wi-Fi.

## Entregaveis previstos

- APK `release` atualizada com labels em PT-BR
- destaque visual da aba ativa em verde neon
- instalacao no device `192.168.0.98:41807`
- validacao de abertura standalone sem dependencia do Metro

## Entregue

- build `release` atualizada gerada em `mobile/android/app/build/outputs/apk/release/app-release.apk`
- APK publicada no device `192.168.0.98:41807` com `adb install -r`
- app aberto via `am start -n com.tocaai.app/.MainActivity`
- foreground confirmado em `com.tocaai.app/.MainActivity`
- logs sem `Unable to load script` e sem `localhost:8081`

## Validacao

- `assembleRelease` concluido com sucesso
- APK gerada com tamanho final de `31.771.302` bytes em `2026-04-07 18:58:54`
- `adb install -r` retornou `Success`
- `dumpsys activity activities` confirmou foreground em `com.tocaai.app/.MainActivity`
- `logcat` mostrou `ReactNativeJS: Running "main"` e nenhum indicio de dependencia de Metro
