# TASK-118 - Publicar build release com limpeza de copy em reviews e detalhe da vaga

Status: DONE
Inicio: 2026-04-08
Fim: 2026-04-08
Backlog relacionado:

- BKL-005
- BKL-019
- BKL-020
- BKL-029

## Objetivo

Gerar e publicar no device a build `release` com o refinamento de copy dos cards de avaliacao e do card de sinais de confianca no detalhe da vaga.

## Validacao tecnica

- `npx.cmd tsc --noEmit`
- `mobile/android`: `$env:NODE_ENV='production'; .\gradlew.bat assembleRelease --no-daemon --console=plain`
- `adb connect 192.168.0.98:41099`
- `adb -s 192.168.0.98:41099 install -r C:\Leonardo\Labs\TocaAI\mobile\android\app\build\outputs\apk\release\app-release.apk`
- `adb -s 192.168.0.98:41099 shell am start -n com.tocaai.app/.MainActivity`
- `dumpsys window windows` confirmou a janela `com.tocaai.app/.MainActivity`

## Resultado

A build `release` com limpeza de copy foi publicada com sucesso no device `192.168.0.98:41099`, pronta para validacao visual no aparelho.
