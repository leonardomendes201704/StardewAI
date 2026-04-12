export type AgentRole = 'coder' | 'researcher' | 'tester' | 'designer'
export type AgentStatus = 'idle' | 'working' | 'done' | 'error'

export interface AgentDefinition {
  id: string
  name: string
  role: AgentRole
  description: string
  tileX: number
  tileY: number
  deskTileX: number
  deskTileY: number
  color: number
}

export interface Task {
  id: string
  agentId: string
  prompt: string
  status: AgentStatus
  result?: string
  startedAt?: number
  completedAt?: number
  visitingAgentId?: string
}
