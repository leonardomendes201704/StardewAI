# StardewAI

Um jogo RPG pixel-art estilo Stardew Valley para orquestrar agentes de IA. Ande por uma vila, interaja com agentes especializados e delegue tarefas reais processadas pelo Claude CLI.

## Como Funciona

Voce e o jogador/orquestrador. Quatro agentes de IA vivem em uma vila pixel-art, cada um em sua sala com uma mesa de trabalho e um notebook. Voce anda pelo cenario, se aproxima de um agente, delega tarefas ou pede para ele visitar outro agente. As tarefas sao processadas pelo Claude CLI usando sua assinatura existente.

## Os Agentes

| Agente | Funcao | Especialidade |
|--------|--------|---------------|
| **Codex** (azul) | Programador | Escreve codigo, debuga, refatora |
| **Scholar** (amarelo) | Pesquisador | Pesquisa, analisa dados, documenta |
| **Sentinel** (vermelho) | Testador | Testa software, encontra bugs, QA |
| **Pixel** (roxo) | Designer | Cria designs UI/UX, paletas, layouts |

## Features

- **Mundo pixel-art** proceduralmente gerado com grama, caminhos, arvores, predios e lago
- **4 agentes com IA real** - cada um com personalidade e especialidade via Claude CLI
- **Delegacao de tarefas** - digite uma tarefa e o agente processa via IA
- **Animacao de trabalho** - agente anda ate a mesa, "digita" no notebook, volta quando termina
- **Visita entre agentes** - envie um agente para conversar com outro, passando contexto da ultima tarefa
- **Status visual** - bolhas flutuantes mostram se o agente esta dormindo, trabalhando ou concluiu
- **HUD** com contador de tarefas ativas e relogio in-game

## Controles

| Tecla | Acao |
|-------|------|
| **WASD** / Setas | Mover personagem |
| **E** | Interagir com agente proximo |
| **SPACE** | Delegar tarefa (no dialogo) |
| **V** | Enviar agente para visitar outro (no dialogo) |
| **D** | Dispensar tarefa concluida |
| **ESC** | Fechar dialogo |

## Como Rodar

### Pre-requisitos
- Node.js 18+
- Claude CLI instalado e autenticado (`npm install -g @anthropic-ai/claude-code`)

### Instalacao

```bash
cd game
npm install
```

### Iniciar

Terminal 1 - Backend (conecta ao Claude CLI):
```bash
node server.cjs
```

Terminal 2 - Frontend (jogo no browser):
```bash
npm run dev
```

Abra `http://localhost:5173` no navegador.

## Arquitetura

```
Frontend (Phaser 3 + TypeScript + Vite)
    |
    | fetch POST /api/task
    | fetch POST /api/agent-visit
    |
Backend (Node.js HTTP server)
    |
    | claude -p "prompt" --system-prompt-file persona.txt
    |
Claude CLI (usa sua assinatura)
```

### Frontend
- **Phaser 3** - engine de jogos 2D com physics, tilemaps, tweens
- **3 cenas simultaneas**: BootScene (loading), MainScene (mundo), UIScene (interface)
- **Sprites gerados programaticamente** - zero assets externos necessarios

### Backend
- Servidor HTTP puro em Node.js (porta 3001)
- Executa `claude` CLI como child process
- Endpoints: `/api/task` (delegar) e `/api/agent-visit` (visita entre agentes)

## Estrutura de Pastas

```
game/
├── server.cjs              # Backend - Claude CLI integration
├── package.json            # Dependencias (phaser, vite, typescript)
├── vite.config.ts          # Config do Vite
├── index.html              # HTML + CSS pixel art
├── src/
│   ├── main.ts             # Entry point - config do Phaser
│   ├── config.ts           # Constantes do jogo
│   ├── types/index.ts      # Tipos TypeScript
│   ├── scenes/
│   │   ├── BootScene.ts    # Gera texturas, tela de loading
│   │   ├── MainScene.ts    # Mundo, jogador, NPCs, mesas
│   │   └── UIScene.ts      # Dialogos, delegacao, HUD
│   ├── entities/
│   │   ├── Player.ts       # Jogador com movimento WASD
│   │   └── AgentNPC.ts     # NPCs com walkToDesk, walkHome, walkToAgent
│   ├── systems/
│   │   ├── WorldBuilder.ts # Gera tilemap do mundo
│   │   ├── TaskManager.ts  # Ciclo de vida das tarefas + visitas
│   │   └── InteractionSystem.ts # Detecta NPCs proximos
│   ├── ui/
│   │   ├── DialogPanel.ts  # Painel de dialogo com agente
│   │   ├── TaskDelegationUI.ts # Modal de delegacao
│   │   ├── AgentSelectUI.ts    # Seletor de agente para visita
│   │   ├── StatusBubble.ts # Icone de status flutuante
│   │   └── HUD.ts          # Barra superior
│   └── data/
│       ├── agents.ts       # Definicao dos 4 agentes
│       ├── personas.ts     # System prompts em portugues
│       └── world-layout.ts # Mapa 40x30 tiles
```

## Tech Stack

- **Phaser 3.80** - Game engine
- **TypeScript** - Linguagem
- **Vite 6** - Build tool
- **Claude CLI** - IA backend (usa assinatura existente)
- **Node.js** - Servidor backend

## Licenca

MIT
