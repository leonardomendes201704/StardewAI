import Phaser from 'phaser'
import { AgentDefinition } from '../types'
import { GAME_WIDTH, GAME_HEIGHT } from '../config'

export class TaskDelegationUI extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Rectangle
  private overlay: Phaser.GameObjects.Rectangle
  private titleText: Phaser.GameObjects.Text
  private domElement: Phaser.GameObjects.DOMElement | null = null
  private currentAgent: AgentDefinition | null = null
  private onSubmit: ((prompt: string) => void) | null = null
  private onCancel: (() => void) | null = null
  private escHandler: ((e: KeyboardEvent) => void) | null = null

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0)

    // Full screen dark overlay
    this.overlay = scene.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2,
      GAME_WIDTH, GAME_HEIGHT,
      0x000000, 0.6
    )
    this.overlay.setInteractive()
    this.add(this.overlay)

    // Modal background
    this.bg = scene.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2,
      420, 260, 0x2a2a4a, 1
    )
    this.bg.setStrokeStyle(4, 0x8888cc)
    this.add(this.bg)

    // Title
    this.titleText = scene.add.text(
      GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100,
      'Delegar Tarefa para',
      {
        fontFamily: '"Press Start 2P"',
        fontSize: '10px',
        color: '#ffffff',
      }
    )
    this.titleText.setOrigin(0.5, 0.5)
    this.add(this.titleText)

    scene.add.existing(this)
    this.setVisible(false)
    this.setDepth(200)
  }

  show(agent: AgentDefinition, onSubmit: (prompt: string) => void, onCancel: () => void): void {
    this.currentAgent = agent
    this.onSubmit = onSubmit
    this.onCancel = onCancel

    this.titleText.setText(`Delegar Tarefa para ${agent.name}`)

    // DISABLE Phaser keyboard so keys go to the textarea
    // Must disable global capture to stop preventDefault on key events
    this.scene.input.keyboard!.disableGlobalCapture()
    this.scene.input.keyboard!.enabled = false
    const mainScene = this.scene.game.scene.getScene('MainScene')
    if (mainScene) {
      mainScene.input.keyboard!.disableGlobalCapture()
      mainScene.input.keyboard!.enabled = false
    }

    // Create DOM element for the form
    const html = `
      <div class="task-modal">
        <p style="margin-bottom: 8px; color: #aaaacc;">
          Descreva a tarefa que voce quer delegar:
        </p>
        <textarea id="task-input" placeholder="Ex: Crie uma funcao que calcula fibonacci..." autofocus></textarea>
        <div style="text-align: right;">
          <button class="cancel" id="task-cancel">Cancelar</button>
          <button id="task-submit">Delegar!</button>
        </div>
      </div>
    `

    this.domElement = this.scene.add.dom(
      GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20
    ).createFromHTML(html)
    this.domElement.setOrigin(0.5, 0.5)
    this.add(this.domElement)

    // Wire up buttons
    const submitBtn = this.domElement.getChildByID('task-submit') as HTMLElement
    const cancelBtn = this.domElement.getChildByID('task-cancel') as HTMLElement
    const textarea = this.domElement.getChildByID('task-input') as HTMLTextAreaElement

    submitBtn?.addEventListener('click', () => {
      const value = textarea?.value?.trim()
      if (value) {
        this.handleSubmit(value)
      }
    })

    cancelBtn?.addEventListener('click', () => {
      this.handleCancel()
    })

    // Allow Enter+Ctrl to submit
    textarea?.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        const value = textarea.value?.trim()
        if (value) {
          this.handleSubmit(value)
        }
      }
    })

    // ESC to cancel - use native DOM listener since Phaser keyboard is disabled
    this.escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.visible) {
        this.handleCancel()
      }
    }
    window.addEventListener('keydown', this.escHandler)

    // Focus the textarea
    setTimeout(() => textarea?.focus(), 100)

    this.setVisible(true)
  }

  private handleSubmit(prompt: string): void {
    this.onSubmit?.(prompt)
    this.hide()
  }

  private handleCancel(): void {
    this.onCancel?.()
    this.hide()
  }

  hide(): void {
    // Remove ESC listener
    if (this.escHandler) {
      window.removeEventListener('keydown', this.escHandler)
      this.escHandler = null
    }

    if (this.domElement) {
      this.domElement.destroy()
      this.domElement = null
    }
    this.setVisible(false)
    this.currentAgent = null

    // RE-ENABLE Phaser keyboard and restore global capture
    this.scene.input.keyboard!.enabled = true
    this.scene.input.keyboard!.enableGlobalCapture()
    const mainScene = this.scene.game.scene.getScene('MainScene')
    if (mainScene) {
      mainScene.input.keyboard!.enabled = true
      mainScene.input.keyboard!.enableGlobalCapture()
    }
  }

  isShowing(): boolean {
    return this.visible
  }
}
