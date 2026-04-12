const { createServer } = require('http')
const { exec } = require('child_process')
const { writeFileSync, unlinkSync } = require('fs')
const { join } = require('path')
const os = require('os')

const PORT = 3001

const CLASSIFICATION_RULE = `

REGRA IMPORTANTE DE CLASSIFICACAO:
Voce DEVE classificar cada mensagem do usuario como CONVERSA ou TAREFA.
- CONVERSA: perguntas casuais, cumprimentos, pedidos de explicacao, bate-papo geral. Exemplos: "oi", "o que voce faz?", "me explica o que e React", "tudo bem?"
- TAREFA: pedidos que exigem trabalho real, como criar codigo, testar algo, fazer design, pesquisar a fundo. Exemplos: "crie uma funcao", "teste o login", "faca um layout", "pesquise sobre X e documente"

FORMATO DA RESPOSTA:
- Se for CONVERSA, comece sua resposta EXATAMENTE com [CHAT] na primeira linha, depois responda normalmente.
- Se for TAREFA, comece sua resposta EXATAMENTE com [TASK] na primeira linha, depois execute a tarefa.
- NUNCA omita o prefixo [CHAT] ou [TASK].`

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
- Limite sua resposta a no maximo 500 caracteres` + CLASSIFICATION_RULE,

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
- Limite sua resposta a no maximo 500 caracteres` + CLASSIFICATION_RULE,

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
- Limite sua resposta a no maximo 500 caracteres` + CLASSIFICATION_RULE,

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
- Limite sua resposta a no maximo 500 caracteres` + CLASSIFICATION_RULE,
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
        const cmd = `claude -p "${escapedPrompt}" --system-prompt-file "${escapedPath}"`

        console.log(`[${agentRole}] CMD: ${cmd.substring(0, 100)}...`)

        exec(cmd, {
          maxBuffer: 1024 * 1024,
          timeout: 120000,
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
            // Parse [CHAT] or [TASK] prefix
            let type = 'task'
            let result = raw
            if (raw.startsWith('[CHAT]')) {
              type = 'chat'
              result = raw.substring(6).trim()
            } else if (raw.startsWith('[TASK]')) {
              type = 'task'
              result = raw.substring(6).trim()
            }
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
        const cmd = `claude -p "${escapedPrompt}" --system-prompt-file "${escapedPath}"`

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

  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not found' }))
})

server.listen(PORT, () => {
  console.log(`StardewAI Backend rodando em http://localhost:${PORT}`)
  console.log('Agentes disponiveis: coder, researcher, tester, designer')
})
