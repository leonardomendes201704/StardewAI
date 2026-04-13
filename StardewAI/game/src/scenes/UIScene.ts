import Phaser from 'phaser'
import { DialogPanel } from '../ui/DialogPanel'
import { TaskDelegationUI } from '../ui/TaskDelegationUI'
import { AgentSelectUI } from '../ui/AgentSelectUI'
import { HUD } from '../ui/HUD'
import { TaskManager } from '../systems/TaskManager'
import { AgentNPC } from '../entities/AgentNPC'
import { AgentDefinition, AgentStatus } from '../types'
import { AGENTS } from '../data/agents'
import { GAME_WIDTH, GAME_HEIGHT } from '../config'

export class UIScene extends Phaser.Scene {
  public dialogPanel!: DialogPanel
  public taskDelegationUI!: TaskDelegationUI
  public agentSelectUI!: AgentSelectUI
  private hud!: HUD
  public taskManager!: TaskManager
  private interactPrompt!: Phaser.GameObjects.Text
  private currentNPC: AgentNPC | null = null
  private escKey!: Phaser.Input.Keyboard.Key
  private spaceKey!: Phaser.Input.Keyboard.Key
  private dKey!: Phaser.Input.Keyboard.Key
  private vKey!: Phaser.Input.Keyboard.Key
  private pendingEvolve: { agentId: string; agentRole: string; prompt: string } | null = null

  constructor() {
    super({ key: 'UIScene' })
  }

  create(): void {
    this.taskManager = new TaskManager(this)

    this.hud = new HUD(this)

    this.interactPrompt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 180, 'Pressione [E] para interagir', {
      fontFamily: '"Press Start 2P"', fontSize: '10px', color: '#ffcc00',
      stroke: '#000000', strokeThickness: 3,
    })
    this.interactPrompt.setOrigin(0.5, 0.5)
    this.interactPrompt.setVisible(false)
    this.interactPrompt.setDepth(90)

    this.tweens.add({
      targets: this.interactPrompt,
      alpha: 0.5, duration: 800, yoyo: true, repeat: -1,
    })

    // Dialog panel with 3 callbacks
    this.dialogPanel = new DialogPanel(this)
    this.dialogPanel.setCallbacks(
      () => this.openTaskDelegation(),
      () => this.dismissCurrentTask(),
      () => this.openAgentSelect(),
      () => this.acceptEvolve()
    )

    this.taskDelegationUI = new TaskDelegationUI(this)
    this.agentSelectUI = new AgentSelectUI(this)

    // Input keys
    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.dKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    this.vKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.V)

    // Events from MainScene
    this.game.events.on('show-interact-prompt', () => {
      if (!this.dialogPanel.isShowing() && !this.taskDelegationUI.isShowing() && !this.agentSelectUI.isShowing()) {
        this.interactPrompt.setVisible(true)
      }
    })

    this.game.events.on('hide-interact-prompt', () => {
      this.interactPrompt.setVisible(false)
    })

    this.game.events.on('npc-interact', (npc: AgentNPC) => {
      if (this.taskDelegationUI.isShowing() || this.agentSelectUI.isShowing()) return
      this.currentNPC = npc
      this.openDialog(npc.agentDef)
    })

    // Task status changes → update HUD + refresh dialog
    this.game.events.on('task-status-changed', (_agentId: string, _status: AgentStatus) => {
      this.hud.updateTasks(
        this.taskManager.getActiveTaskCount(),
        this.taskManager.getTotalTaskCount()
      )
      const currentAgent = this.dialogPanel.getCurrentAgent()
      if (currentAgent && currentAgent.id === _agentId) {
        const task = this.taskManager.getTaskForAgent(_agentId)
        this.dialogPanel.show(currentAgent, task)
      }
    })

    // Agent chat response (no desk walk, inline reply)
    this.game.events.on('agent-chat-response', (agentId: string, message: string) => {
      const agent = AGENTS.find(a => a.id === agentId)
      if (agent) {
        const npc = this.game.scene.getScene('MainScene')?.children?.list?.find(
          (c: any) => c.agentDef?.id === agentId
        ) as any
        if (npc) {
          npc.statusBubble.setStatus('idle')
          npc.idleBehavior?.resume()
        }
        this.dialogPanel.showChatResponse(agent, message)
        this.dialogPanel.setVisible(true)
        this.game.events.emit('dialog-opened')
      }
    })

    // Agent evolve proposal — ask player permission
    this.game.events.on('agent-evolve-proposal', (agentId: string, agentRole: string, prompt: string, proposal: string) => {
      const agent = AGENTS.find(a => a.id === agentId)
      if (agent) {
        const npc = this.game.scene.getScene('MainScene')?.children?.list?.find(
          (c: any) => c.agentDef?.id === agentId
        ) as any
        if (npc) {
          npc.statusBubble.setStatus('idle')
        }
        this.pendingEvolve = { agentId, agentRole, prompt }
        this.dialogPanel.showEvolveProposal(agent, proposal)
        this.dialogPanel.setVisible(true)
        this.game.events.emit('dialog-opened')
      }
    })
  }

  update(time: number, delta: number): void {
    this.hud.update(time, delta)

    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      if (!this.taskDelegationUI.isShowing() && !this.agentSelectUI.isShowing() && this.dialogPanel.isShowing()) {
        this.closeDialog()
      }
    }

    if (this.dialogPanel.isShowing() && !this.taskDelegationUI.isShowing() && !this.agentSelectUI.isShowing()) {
      if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
        this.dialogPanel.handleKeyAction('SPACE')
      }
      if (Phaser.Input.Keyboard.JustDown(this.dKey)) {
        this.dialogPanel.handleKeyAction('D')
      }
      if (Phaser.Input.Keyboard.JustDown(this.vKey)) {
        this.dialogPanel.handleKeyAction('V')
      }
    }
  }

  private openDialog(agent: AgentDefinition): void {
    const task = this.taskManager.getTaskForAgent(agent.id)
    this.dialogPanel.show(agent, task)
    this.interactPrompt.setVisible(false)
    this.game.events.emit('dialog-opened')
  }

  private acceptEvolve(): void {
    if (!this.pendingEvolve) return
    const { agentId, agentRole, prompt } = this.pendingEvolve
    this.pendingEvolve = null
    this.closeDialog()
    this.taskManager.executeEvolve(agentId, agentRole, prompt)
  }

  public closeDialog(): void {
    this.dialogPanel.hide()
    this.currentNPC = null
    this.game.events.emit('dialog-closed')
  }

  private openTaskDelegation(): void {
    const agent = this.dialogPanel.getCurrentAgent()
    if (!agent) return

    this.taskDelegationUI.show(
      agent,
      (prompt: string) => {
        // Send message — backend decides if it's chat or task
        this.taskManager.sendMessage(agent.id, agent.role, prompt)
        this.closeDialog()
      },
      () => {}
    )
  }

  private openAgentSelect(): void {
    const agent = this.dialogPanel.getCurrentAgent()
    if (!agent) return

    this.agentSelectUI.show(
      agent,
      AGENTS,
      (targetAgent, message) => {
        this.taskManager.sendAgentToVisit(
          agent.id, agent.role,
          targetAgent.id, targetAgent.role,
          message
        )
        this.closeDialog()
      },
      () => {}
    )
  }

  private dismissCurrentTask(): void {
    const agent = this.dialogPanel.getCurrentAgent()
    if (!agent) return
    this.taskManager.dismissTask(agent.id)
    this.closeDialog()
  }
}
