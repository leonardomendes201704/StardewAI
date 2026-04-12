import Phaser from 'phaser'
import { AgentDefinition } from '../types'
import { GAME_WIDTH, GAME_HEIGHT } from '../config'

export class AgentSelectUI extends Phaser.GameObjects.Container {
  private overlay: Phaser.GameObjects.Rectangle
  private bg: Phaser.GameObjects.Rectangle
  private titleText: Phaser.GameObjects.Text
  private domElement: Phaser.GameObjects.DOMElement | null = null
  private escHandler: ((e: KeyboardEvent) => void) | null = null

  private onSelect: ((targetAgent: AgentDefinition, message: string) => void) | null = null
  private onCancel: (() => void) | null = null

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0)

    this.overlay = scene.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2,
      GAME_WIDTH, GAME_HEIGHT,
      0x000000, 0.6
    )
    this.overlay.setInteractive()
    this.add(this.overlay)

    this.bg = scene.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2,
      440, 320, 0x2a2a4a, 1
    )
    this.bg.setStrokeStyle(4, 0x88cc88)
    this.add(this.bg)

    this.titleText = scene.add.text(
      GAME_WIDTH / 2, GAME_HEIGHT / 2 - 130,
      'Enviar para qual agente?',
      { fontFamily: '"Press Start 2P"', fontSize: '10px', color: '#ffffff' }
    )
    this.titleText.setOrigin(0.5, 0.5)
    this.add(this.titleText)

    scene.add.existing(this)
    this.setVisible(false)
    this.setDepth(200)
  }

  show(
    currentAgent: AgentDefinition,
    allAgents: AgentDefinition[],
    onSelect: (target: AgentDefinition, message: string) => void,
    onCancel: () => void
  ): void {
    this.onSelect = onSelect
    this.onCancel = onCancel

    // Disable Phaser keyboard
    this.scene.input.keyboard!.disableGlobalCapture()
    this.scene.input.keyboard!.enabled = false
    const mainScene = this.scene.game.scene.getScene('MainScene')
    if (mainScene) {
      mainScene.input.keyboard!.disableGlobalCapture()
      mainScene.input.keyboard!.enabled = false
    }

    const others = allAgents.filter(a => a.id !== currentAgent.id)
    const buttons = others.map(a =>
      `<button class="agent-btn" data-id="${a.id}" style="background:${hexToCSS(a.color)};border:2px solid ${hexToCSS(a.color)};color:#fff;font-family:'Press Start 2P';font-size:9px;padding:8px 12px;cursor:pointer;margin:4px;width:120px;">${a.name}</button>`
    ).join('')

    const html = `
      <div class="task-modal" style="width:420px;">
        <div style="text-align:center;margin-bottom:10px;">${buttons}</div>
        <p style="margin:8px 0 4px;color:#aaaacc;font-size:9px;">Mensagem para o agente visitado:</p>
        <textarea id="visit-input" placeholder="Ex: Explique o que voce fez na ultima tarefa..." autofocus style="width:100%;height:60px;background:#1a1a2e;border:2px solid #6666aa;color:#fff;font-family:'Press Start 2P';font-size:9px;padding:8px;resize:none;outline:none;"></textarea>
        <div style="text-align:right;margin-top:8px;">
          <button id="visit-cancel" class="cancel" style="background:#663333;border:2px solid #884444;color:#fff;font-family:'Press Start 2P';font-size:9px;padding:8px 16px;cursor:pointer;margin-right:8px;">Cancelar</button>
          <button id="visit-submit" style="background:#336633;border:2px solid #448844;color:#fff;font-family:'Press Start 2P';font-size:9px;padding:8px 16px;cursor:pointer;">Enviar!</button>
        </div>
      </div>
    `

    this.domElement = this.scene.add.dom(
      GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20
    ).createFromHTML(html)
    this.domElement.setOrigin(0.5, 0.5)
    this.add(this.domElement)

    let selectedAgent: AgentDefinition | null = null

    // Wire agent buttons
    const agentBtns = this.domElement.node.querySelectorAll('.agent-btn')
    agentBtns.forEach((btn: Element) => {
      (btn as HTMLElement).addEventListener('click', () => {
        // Deselect all
        agentBtns.forEach((b: Element) => (b as HTMLElement).style.outline = 'none')
        // Select this one
        ;(btn as HTMLElement).style.outline = '3px solid #ffffff'
        const id = (btn as HTMLElement).getAttribute('data-id')
        selectedAgent = others.find(a => a.id === id) || null
      })
    })

    // Submit
    const submitBtn = this.domElement.getChildByID('visit-submit') as HTMLElement
    const cancelBtn = this.domElement.getChildByID('visit-cancel') as HTMLElement
    const textarea = this.domElement.getChildByID('visit-input') as HTMLTextAreaElement

    submitBtn?.addEventListener('click', () => {
      const msg = textarea?.value?.trim()
      if (selectedAgent && msg) {
        this.onSelect?.(selectedAgent, msg)
        this.hide()
      }
    })

    cancelBtn?.addEventListener('click', () => {
      this.onCancel?.()
      this.hide()
    })

    this.escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.visible) {
        this.onCancel?.()
        this.hide()
      }
    }
    window.addEventListener('keydown', this.escHandler)

    setTimeout(() => textarea?.focus(), 100)
    this.setVisible(true)
  }

  hide(): void {
    if (this.escHandler) {
      window.removeEventListener('keydown', this.escHandler)
      this.escHandler = null
    }
    if (this.domElement) {
      this.domElement.destroy()
      this.domElement = null
    }
    this.setVisible(false)

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

function hexToCSS(hex: number): string {
  return '#' + hex.toString(16).padStart(6, '0')
}
