# TASK-005 - Validar build local de APK debug

Status: BLOCKED
Inicio: 2026-04-07
Bloqueio registrado em: 2026-04-07
Backlog relacionado: BKL-005

## Objetivo

Verificar se o ambiente local consegue avancar ate o build Android debug do app.

## Resultado atual

O scaffold e o prebuild Android foram executados com sucesso. A validacao do APK debug avancou ate o Gradle, mas o artefato final nao foi emitido dentro desta sessao.

## Bloqueio

- os env vars `ANDROID_HOME` e `ANDROID_SDK_ROOT` apontavam para um SDK antigo em `C:\Program Files (x86)\Android\android-sdk`
- o SDK valido estava em `%LOCALAPPDATA%\Android\Sdk`, onde o `build-tools` necessario ja existia
- apos corrigir manualmente o caminho do SDK para a tentativa de build, o Gradle avancou, mas `assembleDebug` e `:app:packageDebug` nao concluiram dentro do tempo de sessao
- nenhum APK foi gerado em `mobile/android/app/build/outputs/apk`

## Proximo passo sugerido

Normalizar definitivamente o ambiente Android e repetir o build com rastreio mais detalhado:

- fixar `ANDROID_HOME` e `ANDROID_SDK_ROOT` para `%LOCALAPPDATA%\Android\Sdk`
- criar `mobile/android/local.properties` apontando para o SDK correto, se necessario
- rerodar `assembleDebug`
- se o timeout persistir, executar Gradle com `--stacktrace` e `--info` para identificar a task que esta travando

## Observacao

O ambiente possui `JAVA_HOME` valido via Android Studio JBR. O problema deixou de ser ausencia de Java e passou a ser normalizacao do caminho do SDK e finalizacao do build Gradle.

## Atualizacao posterior

O objetivo desta trilha foi destravado na `TASK-008`, que conseguiu emitir o APK debug apos normalizar o SDK local e ajustar a configuracao de build para homologacao Android.
