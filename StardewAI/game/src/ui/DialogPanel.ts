import Phaser from 'phaser'
import { AgentDefinition, Task } from '../types'
import { GAME_WIDTH, GAME_HEIGHT } from '../config'

const ROLE_LABELS: Record<string, string> = {
  coder: 'PROGRAMADOR',
  researcher: 'PESQUISADOR',
  tester: 'TESTADOR',
  designer: 'DESIGNER',
}

const ROLE_COLORS: Record<string, string> = {
  coder: '#4488ff',
  researcher: '#ffcc00',
  tester: '#ff4444',
  designer: '#cc44ff',
}

export class DialogPanel extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Rectangle
  private border: Phaser.GameObjects.Rectangle
  private nameText: Phaser.GameObjects.Text
  private roleText: Phaser.GameObjects.Text
  private descText: Phaser.GameObjects.Text
  private statusText: Phaser.GameObjects.Text
  private actionText: Phaser.GameObjects.Text
  private visitText: Phaser.GameObjects.Text
  private resultText: Phaser.GameObjects.Text
  private currentAgent: AgentDefinition | null = null

  private onAssignTask: (() => void) | null = null
  private onDismissTask: (() => void) | null = null
  private onVisitAgent: (() => void) | null = null
  private onAcceptEvolve: (() => void) | null = null

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0)

    const panelH = 160
    const panelY = GAME_HEIGHT - panelH

    this.bg = scene.add.rectangle(GAME_WIDTH / 2, panelY + panelH / 2, GAME_WIDTH - 20, panelH - 10, 0x1a1a2e, 0.92)
    this.add(this.bg)

    this.border = scene.add.rectangle(GAME_WIDTH / 2, panelY + panelH / 2, GAME_WIDTH - 20, panelH - 10)
    this.border.setStrokeStyle(3, 0x6666aa)
    this.add(this.border)

    const textX = 24
    const textStartY = panelY + 12

    this.nameText = scene.add.text(textX, textStartY, '', {
      fontFamily: '"Press Start 2P"', fontSize: '14px', color: '#ffffff',
    })
    this.add(this.nameText)

    this.roleText = scene.add.text(textX + 200, textStartY + 2, '', {
      fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#888888',
    })
    this.add(this.roleText)

    this.descText = scene.add.text(textX, textStartY + 24, '', {
      fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#cccccc',
      wordWrap: { width: GAME_WIDTH - 60 },
    })
    this.add(this.descText)

    this.statusText = scene.add.text(textX, textStartY + 50, '', {
      fontFamily: '"Press Start 2P"', fontSize: '10px', color: '#88ff88',
    })
    this.add(this.statusText)

    this.resultText = scene.add.text(textX, textStartY + 68, '', {
      fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#aaaaff',
      wordWrap: { width: GAME_WIDTH - 60 },
    })
    this.add(this.resultText)

    // Main action button (left-center)
    this.actionText = scene.add.text(GAME_WIDTH / 2 - 120, panelY + panelH - 22, '', {
      fontFamily: '"Press Start 2P"', fontSize: '9px', color: '#ffcc00',
    })
    this.actionText.setOrigin(0.5, 0.5)
    this.actionText.setInteractive({ useHandCursor: true })
    this.actionText.on('pointerover', () => this.actionText.setColor('#ffffff'))
    this.actionText.on('pointerout', () => this.actionText.setColor('#ffcc00'))
    this.actionText.on('pointerdown', () => this.handleAction())
    this.add(this.actionText)

    // Visit button (right-center)
    this.visitText = scene.add.text(GAME_WIDTH / 2 + 120, panelY + panelH - 22, '', {
      fontFamily: '"Press Start 2P"', fontSize: '9px', color: '#88ccaa',
    })
    this.visitText.setOrigin(0.5, 0.5)
    this.visitText.setInteractive({ useHandCursor: true })
    this.visitText.on('pointerover', () => this.visitText.setColor('#ffffff'))
    this.visitText.on('pointerout', () => this.visitText.setColor('#88ccaa'))
    this.visitText.on('pointerdown', () => this.onVisitAgent?.())
    this.add(this.visitText)

    scene.add.existing(this)
    this.setVisible(false)
    this.setDepth(100)
  }

  show(agent: AgentDefinition, task?: Task): void {
    this.currentAgent = agent
    this.nameText.setText(agent.name)
    this.roleText.setText(ROLE_LABELS[agent.role] || agent.role)
    this.roleText.setColor(ROLE_COLORS[agent.role] || '#888888')
    this.descText.setText(agent.description)
    this.visitText.setText('')

    if (task && task.status === 'working') {
      this.statusText.setText('Status: Trabalhando...')
      this.statusText.setColor('#ff8800')
      this.resultText.setText(`Tarefa: "${task.prompt}"`)
      this.actionText.setText('[ESC para fechar]')
    } else if (task && task.status === 'error') {
      this.statusText.setText('Status: Erro!')
      this.statusText.setColor('#ff4444')
      this.resultText.setText((task.result || 'Erro desconhecido').substring(0, 200))
      this.actionText.setText('[ Dispensar ] (D)')
    } else if (task && task.status === 'done') {
      this.statusText.setText('Status: Concluido!')
      this.statusText.setColor('#88ff88')
      const result = task.result || ''
      this.resultText.setText(result.length > 300 ? result.substring(0, 300) + '...' : result)
      this.actionText.setText('[ Dispensar ] (D)')
    } else {
      this.statusText.setText('Status: Disponivel')
      this.statusText.setColor('#88ff88')
      this.resultText.setText('')
      this.actionText.setText('[ Falar / Delegar ] (SPACE)')
      this.visitText.setText('[ Enviar p/ Agente ] (V)')
    }

    this.setVisible(true)
  }

  showThinking(agent: AgentDefinition): void {
    this.currentAgent = agent
    this.nameText.setText(agent.name)
    this.roleText.setText(ROLE_LABELS[agent.role] || agent.role)
    this.roleText.setColor(ROLE_COLORS[agent.role] || '#888888')
    this.descText.setText(agent.description)
    this.statusText.setText('Pensando...')
    this.statusText.setColor('#ffcc00')
    this.resultText.setText('')
    this.actionText.setText('')
    this.visitText.setText('')
    this.setVisible(true)
  }

  showChatResponse(agent: AgentDefinition, message: string): void {
    this.currentAgent = agent
    this.nameText.setText(agent.name)
    this.roleText.setText(ROLE_LABELS[agent.role] || agent.role)
    this.roleText.setColor(ROLE_COLORS[agent.role] || '#888888')
    this.descText.setText('')
    this.statusText.setText('')
    const truncated = message.length > 400 ? message.substring(0, 400) + '...' : message
    this.resultText.setText(truncated)
    this.actionText.setText('[ OK ] (ESC)')
    this.visitText.setText('[ Falar mais ] (SPACE)')
    this.setVisible(true)
  }

  showEvolveProposal(agent: AgentDefinition, proposal: string): void {
    this.currentAgent = agent
    this.nameText.setText(agent.name)
    this.roleText.setText('EVOLUCAO')
    this.roleText.setColor('#ff8800')
    this.descText.setText('')
    this.statusText.setText('Quer que eu modifique o jogo?')
    this.statusText.setColor('#ffcc00')
    const truncated = proposal.length > 350 ? proposal.substring(0, 350) + '...' : proposal
    this.resultText.setText(truncated)
    this.actionText.setText('[ Aceitar ] (SPACE)')
    this.visitText.setText('[ Dispensar ] (ESC)')
    this.setVisible(true)
  }

  hide(): void {
    this.setVisible(false)
    this.currentAgent = null
  }

  isShowing(): boolean {
    return this.visible
  }

  setCallbacks(onAssign: () => void, onDismiss: () => void, onVisit: () => void, onEvolve?: () => void): void {
    this.onAssignTask = onAssign
    this.onDismissTask = onDismiss
    this.onVisitAgent = onVisit
    this.onAcceptEvolve = onEvolve || null
  }

  private handleAction(): void {
    if (this.actionText.text.includes('Aceitar')) {
      this.onAcceptEvolve?.()
    } else if (this.actionText.text.includes('Delegar') || this.actionText.text.includes('Falar')) {
      this.onAssignTask?.()
    } else if (this.actionText.text.includes('Dispensar')) {
      this.onDismissTask?.()
    }
  }

  handleKeyAction(key: string): void {
    if (key === 'SPACE' && this.actionText.text.includes('Aceitar')) {
      this.onAcceptEvolve?.()
    } else if (key === 'SPACE' && (this.actionText.text.includes('Delegar') || this.visitText.text.includes('Falar'))) {
      this.onAssignTask?.()
    } else if (key === 'D' && this.actionText.text.includes('Dispensar')) {
      this.onDismissTask?.()
    } else if (key === 'V' && this.visitText.text.includes('Enviar')) {
      this.onVisitAgent?.()
    }
  }

  getCurrentAgent(): AgentDefinition | null {
    return this.currentAgent
  }
}
