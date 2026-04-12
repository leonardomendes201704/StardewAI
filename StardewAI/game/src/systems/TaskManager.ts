import Phaser from 'phaser'
import { Task, AgentStatus } from '../types'

const API_URL = 'http://localhost:3001/api/task'
const VISIT_API_URL = 'http://localhost:3001/api/agent-visit'

export class TaskManager {
  private scene: Phaser.Scene
  private tasks: Map<string, Task> = new Map()
  private taskCounter = 0

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  /** Send a message to an agent. The backend classifies it as chat or task. */
  sendMessage(agentId: string, agentRole: string, prompt: string): void {
    const id = `task-${++this.taskCounter}`

    // Show "thinking" state briefly
    this.scene.game.events.emit('agent-thinking', agentId)

    this.executeMessage(id, agentId, agentRole, prompt)
  }

  private async executeMessage(id: string, agentId: string, agentRole: string, prompt: string): Promise<void> {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentRole, prompt }),
      })

      const data = await response.json()

      if (response.ok && data.result) {
        if (data.type === 'chat') {
          // Chat response — show inline, NPC stays put
          this.scene.game.events.emit('agent-chat-response', agentId, data.result)
        } else {
          // Task response — NPC goes to desk, works, then comes back
          const task: Task = {
            id,
            agentId,
            prompt,
            status: 'working',
            result: data.result,
            startedAt: Date.now(),
          }
          this.tasks.set(agentId, task)
          // First go to desk (working state)
          this.scene.game.events.emit('task-status-changed', agentId, 'working' as AgentStatus)
          // After a brief desk animation, mark as done
          window.setTimeout(() => {
            task.status = 'done'
            task.completedAt = Date.now()
            this.scene.game.events.emit('task-status-changed', agentId, 'done' as AgentStatus)
          }, 4000) // 4s at desk
        }
      } else {
        this.scene.game.events.emit('agent-chat-response', agentId,
          `Erro: ${data.error || data.details || 'Falha desconhecida'}`)
      }
    } catch (err) {
      this.scene.game.events.emit('agent-chat-response', agentId,
        `Erro de conexao: ${err instanceof Error ? err.message : 'Backend offline?'}`)
    }
  }

  /** Legacy: directly assign a task (skips classification, always goes to desk) */
  assignTask(agentId: string, agentRole: string, prompt: string): Task {
    const id = `task-${++this.taskCounter}`
    const task: Task = {
      id,
      agentId,
      prompt,
      status: 'working',
      startedAt: Date.now(),
    }
    this.tasks.set(agentId, task)

    this.scene.game.events.emit('task-status-changed', agentId, 'working' as AgentStatus)

    this.executeTaskDirect(agentId, agentRole, prompt)

    return task
  }

  private async executeTaskDirect(agentId: string, agentRole: string, prompt: string): Promise<void> {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentRole, prompt }),
      })

      const data = await response.json()
      const task = this.tasks.get(agentId)
      if (!task) return

      if (response.ok && data.result) {
        let result = data.result
        // Strip [CHAT] or [TASK] prefix if present
        if (result.startsWith('[CHAT]') || result.startsWith('[TASK]')) {
          result = result.substring(6).trim()
        }
        task.result = result
        task.status = 'done'
        task.completedAt = Date.now()
        this.scene.game.events.emit('task-status-changed', agentId, 'done' as AgentStatus)
      } else {
        task.result = `Erro: ${data.error || data.details || 'Falha desconhecida'}`
        task.status = 'error'
        task.completedAt = Date.now()
        this.scene.game.events.emit('task-status-changed', agentId, 'error' as AgentStatus)
      }
    } catch (err) {
      const task = this.tasks.get(agentId)
      if (!task) return
      task.result = `Erro de conexao: ${err instanceof Error ? err.message : 'Backend offline?'}`
      task.status = 'error'
      task.completedAt = Date.now()
      this.scene.game.events.emit('task-status-changed', agentId, 'error' as AgentStatus)
    }
  }

  getTaskForAgent(agentId: string): Task | undefined {
    return this.tasks.get(agentId)
  }

  dismissTask(agentId: string): void {
    this.tasks.delete(agentId)
    this.scene.game.events.emit('task-status-changed', agentId, 'idle' as AgentStatus)
  }

  getActiveTaskCount(): number {
    let count = 0
    for (const task of this.tasks.values()) {
      if (task.status === 'working') count++
    }
    return count
  }

  getTotalTaskCount(): number {
    return this.tasks.size
  }

  sendAgentToVisit(
    visitorId: string,
    visitorRole: string,
    targetId: string,
    targetRole: string,
    prompt: string
  ): Task {
    const id = `task-${++this.taskCounter}`
    const targetTask = this.tasks.get(targetId)
    const targetLastResult = targetTask?.result || 'Nenhuma tarefa anterior encontrada.'

    const task: Task = {
      id,
      agentId: visitorId,
      prompt,
      status: 'working',
      startedAt: Date.now(),
      visitingAgentId: targetId,
    }
    this.tasks.set(visitorId, task)

    this.scene.game.events.emit('task-status-changed', visitorId, 'working' as AgentStatus)

    this.scene.game.events.emit('agent-walk-to-agent', visitorId, targetId, () => {
      this.executeVisit(visitorId, visitorRole, targetRole, prompt, targetLastResult)
    })

    return task
  }

  private async executeVisit(
    visitorId: string,
    visitorRole: string,
    targetRole: string,
    prompt: string,
    targetLastResult: string
  ): Promise<void> {
    try {
      const response = await fetch(VISIT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorRole, targetRole, prompt, targetLastResult }),
      })

      const data = await response.json()
      const task = this.tasks.get(visitorId)
      if (!task) return

      if (response.ok && data.result) {
        task.result = data.result
        task.status = 'done'
        task.completedAt = Date.now()
        this.scene.game.events.emit('task-status-changed', visitorId, 'done' as AgentStatus)
      } else {
        task.result = `Erro: ${data.error || data.details || 'Falha desconhecida'}`
        task.status = 'error'
        task.completedAt = Date.now()
        this.scene.game.events.emit('task-status-changed', visitorId, 'error' as AgentStatus)
      }
    } catch (err) {
      const task = this.tasks.get(visitorId)
      if (!task) return
      task.result = `Erro de conexao: ${err instanceof Error ? err.message : 'Backend offline?'}`
      task.status = 'error'
      task.completedAt = Date.now()
      this.scene.game.events.emit('task-status-changed', visitorId, 'error' as AgentStatus)
    }
  }
}
