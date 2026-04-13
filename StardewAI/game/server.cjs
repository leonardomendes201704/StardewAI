const { createServer } = require('http')
const { exec } = require('child_process')
const { writeFileSync, unlinkSync } = require('fs')
const { join } = require('path')
const os = require('os')

const PORT = 3001

// Path to game source code — NPCs can read this to understand themselves
const GAME_SRC_DIR = join(__dirname, 'src').replace(/\\/g, '/')
const EVOLVE_STATE_FILE = join(__dirname, 'public', 'evolve-result.json')

const SELF_AWARENESS = `

CONSCIENCIA DO MUNDO:
Voce vive dentro de um jogo pixel-art chamado StardewAI, feito com Phaser 3 + TypeScript.
O codigo-fonte do jogo esta disponivel para voce consultar usando ferramentas de leitura.
Voce pode ler qualquer arquivo em src/ para entender como o jogo funciona.

Arquivos importantes que voce pode consultar:
- src/config.ts — constantes do jogo (TILE_SIZE=32, mapa 40x30, etc)
- src/data/world-layout.ts — mapa do mundo (0=grama, 1=terra, 2=agua, 4=arvore, 5=predio, 6=porta)
- src/data/agents.ts — definicao dos 4 agentes (voce e um deles!)
- src/entities/AgentNPC.ts — seu proprio codigo (como voce funciona)
- src/entities/Player.ts — o jogador que conversa com voce
- src/systems/Pathfinder.ts — como voce encontra caminhos no mapa (A*)
- src/systems/IdleBehavior.ts — como voce passeia quando esta ocioso
- src/scenes/MainScene.ts — cena principal do jogo
- server.cjs — o backend que conecta voce ao Claude CLI

Voce mora em uma vila com 4 salas (NW, NE, SW, SE), caminhos de terra, uma fogueira central, um lago ao sul, e arvores nas bordas.
Os outros agentes sao: Codex (programador), Scholar (pesquisador), Sentinel (testador), Pixel (designer).
Quando o jogador te pede algo, voce pode consultar o codigo para dar respostas precisas sobre o jogo.

AUTO-EVOLUCAO:
Se o jogador pedir algo que o jogo NAO suporta atualmente (uma acao, feature, ou comportamento que nao existe no codigo), voce TEM A CAPACIDADE de modificar o codigo-fonte para adicionar essa feature.
Voce pode usar as ferramentas Edit e Write para alterar arquivos TypeScript em src/.
Quando voce fizer isso, descreva o que mudou de forma clara.`

const CLASSIFICATION_RULE = `

REGRA IMPORTANTE DE CLASSIFICACAO:
Voce DEVE classificar cada mensagem do usuario como CONVERSA, TAREFA ou EVOLUCAO.
- CONVERSA ([CHAT]): perguntas casuais, cumprimentos, pedidos de explicacao, bate-papo geral.
- TAREFA ([TASK]): pedidos de trabalho EXTERNO ao jogo (criar codigo para outro projeto, pesquisar um tema, testar algo externo, criar um design).
- EVOLUCAO ([EVOLVE]): QUALQUER pedido que envolva mudar ALGO NO JOGO. Isto inclui: alterar o mapa, adicionar tiles, mover coisas, criar novas acoes, mudar comportamento de NPCs, adicionar features ao jogo, ir ate algum lugar do mapa, interagir com outro NPC de forma nova. Se o jogador pede algo que voce nao consegue fazer apenas respondendo texto — e precisa mudar codigo — use [EVOLVE].

EXEMPLOS DE EVOLUCAO (use [EVOLVE]):
- "Adicione agua perto da fogueira" → [EVOLVE] (muda world-layout.ts)
- "Va ate a casa do Codex" → [EVOLVE] (precisa criar acao de movimento)
- "Quero que voce siga o jogador" → [EVOLVE] (precisa criar follow behavior)
- "Mude sua cor para verde" → [EVOLVE] (muda agents.ts)
- "Adicione um NPC novo" → [EVOLVE] (muda agents.ts + BootScene)

EXEMPLOS DE TAREFA (use [TASK]):
- "Crie uma funcao JavaScript de fibonacci" → [TASK] (codigo externo)
- "Pesquise sobre React hooks" → [TASK]

FORMATO DA RESPOSTA:
- [CHAT] para conversa
- [TASK] para tarefa externa
- [EVOLVE] para qualquer mudanca no jogo. NAO modifique arquivos agora — apenas DESCREVA o que voce mudaria e onde. O jogador vai aprovar antes de voce executar.
- NUNCA omita o prefixo.`

const AGENT_PERSONAS = {
  coder: `Voce e o Codex, um programador especialista.
Seu papel:
- Escrever codigo limpo e funcional
- Debuggar e corrigir bugs
- Refatorar codigo existente
- Explicar conceitos tecnicos de forma simples

Regras:
- Responda SEMPRE em portugues brasileiro
- Seja direto e objetivo
- Quando escrever codigo, use blocos de codigo formatados
- Limite sua resposta a no maximo 500 caracteres` + SELF_AWARENESS + CLASSIFICATION_RULE,

  researcher: `Voce e o Scholar, um pesquisador especialista.
Seu papel:
- Pesquisar topicos e resumir informacoes
- Analisar dados e tendencias
- Comparar alternativas e recomendar solucoes
- Documentar descobertas

Regras:
- Responda SEMPRE em portugues brasileiro
- Seja direto e objetivo
- Use listas e bullet points para organizar informacoes
- Limite sua resposta a no maximo 500 caracteres` + SELF_AWARENESS + CLASSIFICATION_RULE,

  tester: `Voce e o Sentinel, um testador de software especialista.
Seu papel:
- Testar funcionalidades e encontrar bugs
- Criar planos de teste
- Reportar problemas encontrados
- Sugerir melhorias de qualidade

Regras:
- Responda SEMPRE em portugues brasileiro
- Seja direto e objetivo
- Liste bugs e problemas de forma clara
- Limite sua resposta a no maximo 500 caracteres` + SELF_AWARENESS + CLASSIFICATION_RULE,

  designer: `Voce e o Pixel, um designer UI/UX especialista.
Seu papel:
- Criar designs de interface
- Sugerir melhorias visuais
- Definir paletas de cores e tipografia
- Prototipar layouts e fluxos de usuario

Regras:
- Responda SEMPRE em portugues brasileiro
- Seja direto e objetivo
- Descreva layouts e visuais de forma clara
- Limite sua resposta a no maximo 500 caracteres` + SELF_AWARENESS + CLASSIFICATION_RULE,
}

const server = createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }

  if (req.method === 'POST' && req.url === '/api/task') {
    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => {
      try {
        const { agentRole, prompt } = JSON.parse(body)
        const persona = AGENT_PERSONAS[agentRole]
        if (!persona) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: `Unknown agent role: ${agentRole}` }))
          return
        }

        const fullPrompt = `${persona}\n\nTarefa do usuario: ${prompt}`

        console.log(`[${agentRole}] Executando tarefa: ${prompt}`)

        // Write persona to temp file for --system-prompt-file
        const tmpFile = join(os.tmpdir(), `stardew-persona-${agentRole}.txt`)
        writeFileSync(tmpFile, persona, 'utf8')

        // Build command string with proper quoting
        const escapedPrompt = prompt.replace(/"/g, '\\"')
        const escapedPath = tmpFile.replace(/\\/g, '/')
        const cmd = `claude -p "${escapedPrompt}" --system-prompt-file "${escapedPath}" --add-dir "${GAME_SRC_DIR}"`

        console.log(`[${agentRole}] CMD: ${cmd.substring(0, 150)}...`)

        exec(cmd, {
          cwd: __dirname,
          maxBuffer: 1024 * 1024 * 5,
          timeout: 180000,
          env: { ...process.env },
        }, (err, stdout, stderr) => {
          // Clean up temp file
          try { unlinkSync(tmpFile) } catch (_) {}

          if (err) {
            console.error(`[${agentRole}] Erro: ${err.message}`)
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({
              error: 'Claude CLI failed',
              details: stderr || err.message,
            }))
            return
          }

          const raw = stdout.trim()
          if (raw) {
            // Parse [CHAT], [TASK], or [EVOLVE] — search anywhere in first 200 chars
            let type = 'task'
            let result = raw
            const head = raw.substring(0, 300)
            if (head.includes('[EVOLVE]')) {
              type = 'evolve'
              result = raw.replace(/\[EVOLVE\]/gi, '').trim()
            } else if (head.includes('[CHAT]')) {
              type = 'chat'
              result = raw.replace(/\[CHAT\]/gi, '').trim()
            } else if (head.includes('[TASK]')) {
              type = 'task'
              result = raw.replace(/\[TASK\]/gi, '').trim()
            }
            // Auto-detect evolve if response mentions editing game files
            if (type === 'task' && /src\/|\.ts\b|world-layout|agents\.ts|config\.ts|editar.*arquivo|modificar.*codigo|permiss/i.test(result)) {
              type = 'evolve'
              console.log(`[${agentRole}] Auto-detected as EVOLVE (mentions game files)`)
            }
            console.log(`[${agentRole}] ${type.toUpperCase()} (${result.length} chars)`)
            console.log(`[${agentRole}] ${type.toUpperCase()} (${result.length} chars)`)
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ result, type }))
          } else {
            console.error(`[${agentRole}] Sem output. stderr: ${stderr}`)
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'No output from Claude CLI', details: stderr }))
          }
        })

      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Invalid JSON body' }))
      }
    })
    return
  }

  if (req.method === 'POST' && req.url === '/api/agent-visit') {
    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => {
      try {
        const { visitorRole, targetRole, prompt, targetLastResult } = JSON.parse(body)
        const visitorPersona = AGENT_PERSONAS[visitorRole]
        if (!visitorPersona) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: `Unknown visitor role: ${visitorRole}` }))
          return
        }

        const AGENT_NAMES = { coder: 'Codex', researcher: 'Scholar', tester: 'Sentinel', designer: 'Pixel' }
        const targetName = AGENT_NAMES[targetRole] || targetRole

        const visitPrompt = `Voce foi visitar o agente ${targetName} (${targetRole}). O resultado da ultima tarefa dele foi:\n\n---\n${targetLastResult}\n---\n\nO usuario pediu: ${prompt}`

        const tmpFile = join(os.tmpdir(), `stardew-visit-${visitorRole}.txt`)
        writeFileSync(tmpFile, visitorPersona, 'utf8')

        const escapedPrompt = visitPrompt.replace(/"/g, '\\"')
        const escapedPath = tmpFile.replace(/\\/g, '/')
        const cmd = `claude -p "${escapedPrompt}" --system-prompt-file "${escapedPath}" --add-dir "${GAME_SRC_DIR}"`

        console.log(`[${visitorRole}→${targetRole}] Visitando: ${prompt.substring(0, 60)}...`)

        exec(cmd, {
          maxBuffer: 1024 * 1024,
          timeout: 120000,
          env: { ...process.env },
        }, (err, stdout, stderr) => {
          try { unlinkSync(tmpFile) } catch (_) {}

          if (err) {
            console.error(`[${visitorRole}→${targetRole}] Erro: ${err.message}`)
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Claude CLI failed', details: stderr || err.message }))
            return
          }

          const result = stdout.trim()
          if (result) {
            console.log(`[${visitorRole}→${targetRole}] Concluido (${result.length} chars)`)
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ result }))
          } else {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'No output', details: stderr }))
          }
        })

      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Invalid JSON body' }))
      }
    })
    return
  }

  // Evolve endpoint — executes with full write permissions after player approval
  if (req.method === 'POST' && req.url === '/api/evolve-execute') {
    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => {
      try {
        const { agentRole, prompt } = JSON.parse(body)
        const persona = AGENT_PERSONAS[agentRole]
        if (!persona) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: `Unknown agent role: ${agentRole}` }))
          return
        }

        const evolvePrompt = `${prompt}\n\nO jogador APROVOU esta mudanca. Voce DEVE editar o arquivo agora. Use a ferramenta Edit para modificar o codigo. Nao pergunte, apenas faca a mudanca e descreva o que fez.`

        const tmpFile = join(os.tmpdir(), `stardew-evolve-${agentRole}.txt`)
        writeFileSync(tmpFile, persona, 'utf8')

        const escapedPath = tmpFile.replace(/\\/g, '/')

        console.log(`[${agentRole}] EVOLVE EXECUTE: ${prompt.substring(0, 80)}...`)

        const { execFile } = require('child_process')
        execFile('claude', [
          '-p', evolvePrompt,
          '--system-prompt-file', escapedPath,
          '--add-dir', GAME_SRC_DIR,
          '--allowedTools', 'Read,Grep,Glob,Edit,Write',
          '--dangerously-skip-permissions',
        ], {
          cwd: __dirname,
          maxBuffer: 1024 * 1024 * 5,
          timeout: 180000,
          env: { ...process.env },
        }, (err, stdout, stderr) => {
          try { unlinkSync(tmpFile) } catch (_) {}

          if (err) {
            console.error(`[${agentRole}] Evolve error: ${err.message}`)
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Evolve failed', details: stderr || err.message }))
            return
          }

          const raw = stdout.trim()
          let result = raw
          if (raw.startsWith('[EVOLVE]')) result = raw.substring(8).trim()
          else if (raw.startsWith('[TASK]')) result = raw.substring(6).trim()
          else if (raw.startsWith('[CHAT]')) result = raw.substring(6).trim()

          console.log(`[${agentRole}] EVOLVED! (${result.length} chars)`)

          // Save evolve result so game can show it after reload
          try {
            const { mkdirSync } = require('fs')
            try { mkdirSync(join(__dirname, 'public'), { recursive: true }) } catch(_) {}
            writeFileSync(EVOLVE_STATE_FILE, JSON.stringify({
              agentId: agentRole === 'coder' ? 'coder' : agentRole === 'researcher' ? 'researcher' : agentRole === 'tester' ? 'tester' : 'designer',
              agentName: { coder: 'Codex', researcher: 'Scholar', tester: 'Sentinel', designer: 'Pixel' }[agentRole],
              result,
              timestamp: Date.now(),
            }), 'utf8')
          } catch(_) {}

          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ result, type: 'evolve' }))
        })

      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Invalid JSON body' }))
      }
    })
    return
  }

  if (req.method === 'POST' && req.url === '/api/clear-evolve') {
    try { unlinkSync(EVOLVE_STATE_FILE) } catch(_) {}
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true }))
    return
  }

  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not found' }))
})

server.listen(PORT, () => {
  console.log(`StardewAI Backend rodando em http://localhost:${PORT}`)
  console.log('Agentes disponiveis: coder, researcher, tester, designer')
})
