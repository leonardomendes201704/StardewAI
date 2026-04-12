import { AgentDefinition } from '../types'

export const AGENTS: AgentDefinition[] = [
  {
    id: 'coder',
    name: 'Codex',
    role: 'coder',
    description: 'Escreve e debugga codigo. Especialista em TypeScript, Python e mais.',
    tileX: 8,
    tileY: 6,
    deskTileX: 8,
    deskTileY: 5,
    color: 0x4488ff
  },
  {
    id: 'researcher',
    name: 'Scholar',
    role: 'researcher',
    description: 'Pesquisa topicos e resume informacoes de forma clara e objetiva.',
    tileX: 31,
    tileY: 6,
    deskTileX: 31,
    deskTileY: 5,
    color: 0xffcc00
  },
  {
    id: 'tester',
    name: 'Sentinel',
    role: 'tester',
    description: 'Testa software, encontra bugs e reporta problemas.',
    tileX: 8,
    tileY: 22,
    deskTileX: 8,
    deskTileY: 23,
    color: 0xff4444
  },
  {
    id: 'designer',
    name: 'Pixel',
    role: 'designer',
    description: 'Cria designs de UI, mockups visuais e prototipos.',
    tileX: 31,
    tileY: 22,
    deskTileX: 31,
    deskTileY: 23,
    color: 0xcc44ff
  }
]
