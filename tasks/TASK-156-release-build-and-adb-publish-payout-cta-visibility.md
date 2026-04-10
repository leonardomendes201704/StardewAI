# TASK-156 - Publicar build release com CTA de repasse visivel

- Status: DONE
- Inicio: 2026-04-09
- Fim: 2026-04-09
- Backlog relacionado: BKL-005, BKL-031, BKL-039

## Objetivo

Gerar build `release`, publicar no device Android por ADB Wi-Fi e validar que o CTA de repasse passou a aparecer no detalhe da vaga do Musico quando o pagamento estiver em `funds_held`.

## Evidencias

- `npx.cmd tsc --noEmit` executado com sucesso
- Build `release` gerada em `mobile/android/app/build/outputs/apk/release/app-release.apk`
- APK instalada no device `192.168.0.98:38715` com `adb install -r`
- App relancado via `adb shell monkey -p com.tocaai.app -c android.intent.category.LAUNCHER 1`
