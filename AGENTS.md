# TocaAI - Instrucoes Operacionais para Agents

Estas instrucoes existem para evitar retrabalho em futuras sessoes, especialmente em build e homologacao Android.

## Regra geral de homologacao no device

- Para instalar no aparelho sem depender do Metro local, usar build `release`.
- Nao usar o APK `debug` para homologacao standalone.
- O APK `debug` tenta carregar JS do Metro em `localhost:8081` e pode travar no splash com tela branca.

## Build Android recomendado

### Build para homologacao standalone

Executar em `C:\Leonardo\Labs\TocaAI\mobile\android`:

```powershell
$env:NODE_ENV='production'
.\gradlew.bat assembleRelease --no-daemon --console=plain
```

Artefato esperado:

- `C:\Leonardo\Labs\TocaAI\mobile\android\app\build\outputs\apk\release\app-release.apk`

### Build debug

Executar apenas quando a intencao for desenvolvimento local com Metro:

```powershell
$env:NODE_ENV='development'
.\gradlew.bat assembleDebug --no-daemon --console=plain
```

Artefato esperado:

- `C:\Leonardo\Labs\TocaAI\mobile\android\app\build\outputs\apk\debug\app-debug.apk`

## Regras tecnicas ja validadas

- `react-native-worklets` exige `newArchEnabled=true`
- a ABI atual foi reduzida para `arm64-v8a` para acelerar homologacao em device Android real
- o SDK Android deve apontar para `C:\Users\devcr\AppData\Local\Android\Sdk`
- o projeto usa `mobile/android/local.properties` para fixar esse SDK

## Fluxo ADB Wi-Fi

### 1. Verificar se o device ja esta conectado

```powershell
adb devices -l
```

Se o device aparecer como `device`, seguir direto para instalacao.

### 2. Se ainda nao estiver conectado

No Android:

- abrir `Configuracoes > Opcoes do desenvolvedor > Depuracao sem fio`
- se necessario, abrir `Parear dispositivo com codigo`

### 3. Se precisar parear

Solicitar ao usuario:

- `Codigo de pareamento`
- `Endereco IP e porta` da tela de pareamento

Executar:

```powershell
$code='CODIGO'
$code | adb pair IP:PORTA
```

### 4. Conectar apos o pareamento

Solicitar ao usuario o `Endereco IP e porta` da tela principal de `Depuracao sem fio`.

Importante:

- a porta de `adb pair` nao e a mesma porta de `adb connect`
- a porta principal muda com frequencia

Executar:

```powershell
adb connect IP:PORTA
adb devices -l
```

### 5. Instalar o app

Executar:

```powershell
adb -s IP:PORTA install -r C:\Leonardo\Labs\TocaAI\mobile\android\app\build\outputs\apk\release\app-release.apk
adb -s IP:PORTA shell monkey -p com.tocaai.app -c android.intent.category.LAUNCHER 1
```

## Validacao pos-instalacao

### Comportamento esperado

- app abre sem depender de Metro
- shell inicial com abas `Bar` e `Musico`
- tela `Bar` mostra `Painel inicial do Bar`
- tela `Musico` mostra `Painel inicial do Musico`

### Se abrir tela branca com imagem central

Interpretacao:

- foi instalada uma build `debug`
- ou o app ainda esta tentando conectar no Metro

Verificar com:

```powershell
adb -s IP:PORTA logcat -d | Select-String "Unable to load script|localhost:8081|ReactNativeJS|tocaai"
```

Se aparecer `Unable to load script` ou `localhost:8081`, reinstalar a build `release`.

## Comandos validados nesta sessao

### Pareamento

```powershell
$code='495585'
$code | adb pair 192.168.0.98:41605
```

### Conexao

```powershell
adb connect 192.168.0.98:41807
```

### Instalacao standalone

```powershell
adb -s 192.168.0.98:41807 install -r C:\Leonardo\Labs\TocaAI\mobile\android\app\build\outputs\apk\release\app-release.apk
adb -s 192.168.0.98:41807 shell monkey -p com.tocaai.app -c android.intent.category.LAUNCHER 1
```

## Regra de processo

- Sempre que um agent iniciar ou concluir uma nova trilha de instalacao, build ou homologacao, criar a `TASK-###` correspondente e atualizar `TASKS.md`.
- Sempre refletir no `BACKLOG.md` quando o status de build ou homologacao mudar.

## MCP do Supabase

- O MCP do Supabase foi adicionado ao arquivo global `C:\Users\devcr\.codex\config.toml`.
- Entrada configurada:

```toml
[mcp_servers.supabase]
type = "http"
url = "https://mcp.supabase.com/mcp"
```

- A ativacao real depende de o cliente Codex recarregar a configuracao.
- Quando o cliente solicitar autenticacao, concluir o login OAuth do Supabase.
- Depois da recarga, preferir usar o MCP do Supabase para projeto, schema, SQL, logs e chaves do projeto.

### Regra operacional quando esta thread ficar com `Auth required`

- Se os tools `supabase/*` desta thread responderem `Auth required`, nao insistir em novas tentativas repetidas no mesmo tool runtime.
- Antes de tentar alternativas, verificar no shell:
  - `codex mcp list`
  - `codex mcp get supabase`
- Se o shell mostrar `supabase` com `Auth = OAuth`, assumir que a autenticacao global esta correta e que o problema e cache stale desta thread.
- Nessa situacao, usar imediatamente um runtime novo via `codex exec` para qualquer operacao remota no Supabase, em vez de continuar tentando o tool embutido desta conversa.
- Priorizar `codex exec` para:
  - aplicar migrations
  - consultar tabelas, views e funcoes
  - validar contagens e evidencias remotas
- So sugerir reinicio do Codex ou abertura de nova thread quando for realmente necessario voltar a usar os tools `supabase/*` diretamente nesta conversa.

### Exemplo de abordagem validada

Executar no shell, a partir da raiz do projeto:

```powershell
codex exec -C C:\Leonardo\Labs\TocaAI --dangerously-bypass-approvals-and-sandbox "Use the Supabase MCP tools for the configured project. Call get_project_url and list_tables for schema public, then answer briefly."
```

Se esse runtime novo responder `mcp: supabase ready` e completar a chamada com sucesso, considerar o MCP operacional e seguir por essa via sem voltar para o caminho que ja falhou na thread atual.
