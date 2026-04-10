# TASK-009 - Instalar APK via ADB Wi-Fi no dispositivo de homologacao

Status: DONE
Inicio: 2026-04-07
Conclusao: 2026-04-07
Backlog relacionado: BKL-005

## Objetivo

Conectar ao dispositivo Android via ADB em rede local e instalar o APK debug do TocaAI para homologacao.

## Evidencias coletadas

- dispositivo informado pelo usuario: `192.168.0.98:1807`
- IP desta maquina no Wi-Fi: `192.168.0.196/24`
- APK disponivel em `C:\Leonardo\Labs\TocaAI\mobile\android\app\build\outputs\apk\debug\app-debug.apk`

## Tentativas realizadas

```powershell
Test-NetConnection -ComputerName 192.168.0.98 -Port 1807
adb connect 192.168.0.98:1807
Test-NetConnection -ComputerName 192.168.0.98 -Port 42649
adb connect 192.168.0.98:42649
$code='495585'; $code | adb pair 192.168.0.98:41605
adb devices -l
adb reconnect offline
adb connect 192.168.0.98:42649
```

## Resultado final

Conexao e instalacao concluidas com sucesso no dispositivo.

## Historico de tentativas

Primeira tentativa:

- `TcpTestSucceeded = False`
- `cannot connect to 192.168.0.98:1807: ... recusou ativamente. (10061)`

Segunda tentativa:

- `TcpTestSucceeded = True` em `192.168.0.98:42649`
- `adb connect 192.168.0.98:42649` retornou `failed to connect`

Terceira tentativa:

- `adb pair 192.168.0.98:41605` concluiu com sucesso
- o dispositivo apareceu temporariamente como `192.168.0.98:42649 offline`
- apos `adb reconnect offline`, o endpoint `192.168.0.98:42649` passou a recusar conexao com `(10061)`

Tentativa final bem-sucedida:

- `adb connect 192.168.0.98:41807` conectou com sucesso
- o dispositivo entrou como `device`
- `adb install -r ...\\app-debug.apk` concluiu com `Success`
- o app foi aberto com `adb shell monkey -p com.tocaai.app -c android.intent.category.LAUNCHER 1`

## Comandos validados

```powershell
adb connect 192.168.0.98:41807
adb -s 192.168.0.98:41807 install -r C:\Leonardo\Labs\TocaAI\mobile\android\app\build\outputs\apk\debug\app-debug.apk
adb -s 192.168.0.98:41807 shell monkey -p com.tocaai.app -c android.intent.category.LAUNCHER 1
```

## Dispositivo homologado

- modelo reportado pelo ADB: `moto g(9) play`
- package instalado: `com.tocaai.app`
