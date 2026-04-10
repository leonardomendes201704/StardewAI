# TASK-008 - Homologar build Android e emitir APK debug

Status: DONE
Inicio: 2026-04-07
Conclusao: 2026-04-07
Backlog relacionado: BKL-005

## Objetivo

Obter um APK debug funcional para iniciar a homologacao tecnica das tasks concluidas no app mobile.

## Escopo

- normalizar a configuracao local do Android SDK para o projeto
- identificar a etapa exata do build que ainda bloqueia a emissao do APK
- aplicar correcoes de configuracao, ambiente ou build
- emitir um APK debug em `mobile/android/app/build/outputs/apk`

## Criterio de saida

Um dos dois estados abaixo deve ser registrado ao final:

- `DONE`: APK debug gerado com caminho documentado
- `BLOCKED`: bloqueio tecnico identificado com causa objetiva, evidencias e proximo passo

## Resultado

APK debug gerado com sucesso em:

- `C:\Leonardo\Labs\TocaAI\mobile\android\app\build\outputs\apk\debug\app-debug.apk`

## Comando validado

Executado a partir de `mobile/android`:

```powershell
$env:NODE_ENV='development'
.\gradlew.bat assembleDebug --no-daemon --console=plain
```

## Ajustes que destravaram o build

- criacao de `mobile/android/local.properties` apontando para `C:\Users\devcr\AppData\Local\Android\Sdk`
- manutencao de `newArchEnabled=true` por exigencia de `react-native-worklets`
- reducao de `reactNativeArchitectures` para `arm64-v8a` para acelerar a homologacao

## Observacoes

- o APK atual foi otimizado para homologacao em dispositivo Android ARM64
- se houver necessidade de homologacao em emulador x86_64, a lista de ABIs precisara ser ampliada novamente
