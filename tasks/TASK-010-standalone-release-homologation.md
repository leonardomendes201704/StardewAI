# TASK-010 - Gerar build standalone para homologacao sem Metro

Status: DONE
Inicio: 2026-04-07
Conclusao: 2026-04-07
Backlog relacionado: BKL-005

## Objetivo

Gerar e instalar uma build Android que funcione sozinha no dispositivo, sem depender do Metro local em `localhost:8081`.

## Diagnostico de entrada

O APK `debug` foi instalado e abriu no aparelho, mas o logcat mostrou:

- `Unable to load script`
- tentativa de conexao com `ws://localhost:8081`

Isso confirma que a build atual depende do servidor Metro, o que nao serve para homologacao standalone.

## Resultado esperado

- APK release ou equivalente com bundle embarcado
- instalacao no dispositivo via ADB Wi-Fi
- app abrindo a shell inicial do TocaAI sem travar no splash

## Resultado

- build `release` gerada com sucesso em `C:\Leonardo\Labs\TocaAI\mobile\android\app\build\outputs\apk\release\app-release.apk`
- instalacao via ADB Wi-Fi concluida no dispositivo
- logcat confirmou inicializacao correta com `ReactNativeJS: Running "main"`
- o erro `Unable to load script` desapareceu na build release

## Comandos validados

```powershell
cd C:\Leonardo\Labs\TocaAI\mobile\android
$env:NODE_ENV='production'
.\gradlew.bat assembleRelease --no-daemon --console=plain

adb -s 192.168.0.98:41807 install -r C:\Leonardo\Labs\TocaAI\mobile\android\app\build\outputs\apk\release\app-release.apk
adb -s 192.168.0.98:41807 shell monkey -p com.tocaai.app -c android.intent.category.LAUNCHER 1
```

## Diagnostico consolidado

- a build `debug` instalada antes dependia do Metro local em `localhost:8081`
- para homologacao em aparelho sem servidor local, a build correta e a `release`
