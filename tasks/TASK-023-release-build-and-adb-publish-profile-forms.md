# TASK-023 - Publicar build release com formularios de perfil via ADB Wi-Fi

Status: DONE
Inicio: 2026-04-07
Fim: 2026-04-07
Backlog relacionado: BKL-005, BKL-012, BKL-013

## Objetivo

Gerar uma nova build `release` com os formularios de perfil de Bar e Musico e publicar no device Android de homologacao via ADB Wi-Fi.

## Entregaveis previstos

- APK `release` atualizado com telas de perfil editaveis
- instalacao no device `192.168.0.98:41807`
- abertura do app sem dependencia do Metro
- registro da operacao em task e backlog

## Entregue

- build `release` atualizada gerada em `mobile/android/app/build/outputs/apk/release/app-release.apk`
- APK publicado no device `192.168.0.98:41807` com `adb install -r`
- app aberto via `am start -n com.tocaai.app/.MainActivity`
- foreground confirmado em `com.tocaai.app/.MainActivity`
- logs sem `Unable to load script` e sem `localhost:8081`

## Validacao

- `assembleRelease` concluido com sucesso
- APK gerado com tamanho final de `31.771.146` bytes em `2026-04-07 18:36:04`
- `adb install -r` retornou `Success`
- `dumpsys activity activities` confirmou foreground em `com.tocaai.app/.MainActivity`
- `logcat` mostrou `ReactNativeJS: Running "main"` e nenhum indicio de dependencia de Metro
