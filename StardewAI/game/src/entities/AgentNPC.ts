import Phaser from 'phaser'
import { AgentDefinition, AgentStatus } from '../types'
import { TILE_SIZE } from '../config'
import { StatusBubble } from '../ui/StatusBubble'
import { IdleBehavior } from '../systems/IdleBehavior'
import { findPath, pixelToTile, tileToPixel, registerOccupied, unregisterOccupied, isTileOccupied } from '../systems/Pathfinder'

// Generate 4 directional textures per NPC (like Player)
export function generateNPCTexture(scene: Phaser.Scene, id: string, color: number): void {
  const dirs = ['down', 'left', 'right', 'up']
  for (let row = 0; row < 4; row++) {
    const gfx = scene.add.graphics()

    // Body
    gfx.fillStyle(color, 1)
    gfx.fillRect(8, 10, 16, 16)
    // Head
    gfx.fillStyle(0xffcc99, 1)
    gfx.fillRect(10, 2, 12, 10)
    // Hair/hat
    gfx.fillStyle(color, 1)
    gfx.fillRect(9, 1, 14, 4)

    // Eyes based on direction
    gfx.fillStyle(0x000000, 1)
    if (row === 0) { // down
      gfx.fillRect(12, 7, 2, 2)
      gfx.fillRect(18, 7, 2, 2)
    } else if (row === 1) { // left
      gfx.fillRect(11, 7, 2, 2)
    } else if (row === 2) { // right
      gfx.fillRect(19, 7, 2, 2)
    }
    // up (row 3) — no eyes

    // Smile (only when facing down)
    if (row === 0) {
      gfx.fillStyle(0x000000, 1)
      gfx.fillRect(13, 10, 6, 1)
    }

    // Legs
    gfx.fillStyle(darken(color), 1)
    gfx.fillRect(10, 26, 5, 4)
    gfx.fillRect(17, 26, 5, 4)

    gfx.generateTexture(`npc-${id}-${dirs[row]}`, TILE_SIZE, TILE_SIZE)
    gfx.destroy()
  }
}

function darken(color: number): number {
  const r = Math.max(0, ((color >> 16) & 0xff) - 40)
  const g = Math.max(0, ((color >> 8) & 0xff) - 40)
  const b = Math.max(0, (color & 0xff) - 40)
  return (r << 16) | (g << 8) | b
}

type NPCState = 'idle' | 'walking-to-desk' | 'working' | 'walking-home' | 'walking-to-agent' | 'visiting' | 'walking-to-player' | 'reporting'

export class AgentNPC extends Phaser.Physics.Arcade.Sprite {
  public agentDef: AgentDefinition
  public statusBubble: StatusBubble
  private nameLabel: Phaser.GameObjects.Text

  public homeX: number
  public homeY: number
  public deskX: number
  public deskY: number

  private npcState: NPCState = 'idle'
  private typingTween: Phaser.Tweens.Tween | null = null
  public idleBehavior: IdleBehavior | null = null
  private currentDir = 'down'

  // Path walking
  private pathQueue: { x: number; y: number }[] = []
  private currentPathTween: Phaser.Tweens.Tween | null = null
  private pathCallback: (() => void) | null = null
  private currentTileX = 0
  private currentTileY = 0

  // "Oi" balloon
  private oiBalloonBg: Phaser.GameObjects.Rectangle | null = null
  private oiBalloonText: Phaser.GameObjects.Text | null = null
  private playerNearby = false

  // Thought bubble (shows during work)
  private thoughtBg: Phaser.GameObjects.Rectangle | null = null
  private thoughtText: Phaser.GameObjects.Text | null = null
  private thoughtTimer: ReturnType<typeof setInterval> | null = null
  private thoughtMessages: string[] = []
  private thoughtIndex = 0

  constructor(scene: Phaser.Scene, def: AgentDefinition) {
    const px = def.tileX * TILE_SIZE + TILE_SIZE / 2
    const py = def.tileY * TILE_SIZE + TILE_SIZE / 2

    super(scene, px, py, `npc-${def.id}-down`)
    this.agentDef = def

    this.homeX = px
    this.homeY = py
    this.deskX = def.deskTileX * TILE_SIZE + TILE_SIZE / 2
    this.deskY = def.deskTileY * TILE_SIZE + TILE_SIZE / 2

    scene.add.existing(this)
    scene.physics.add.existing(this)

    const body = this.body as Phaser.Physics.Arcade.Body
    body.setImmovable(true)
    this.setSize(20, 20)
    this.setOffset(6, 10)

    this.npcState = 'idle'

    // Register initial tile position
    this.currentTileX = def.tileX
    this.currentTileY = def.tileY
    registerOccupied(this.currentTileX, this.currentTileY, def.id)

    this.idleBehavior = new IdleBehavior(scene, this)

    this.statusBubble = new StatusBubble(scene, px, py)

    this.nameLabel = scene.add.text(px, py + TILE_SIZE / 2 + 4, def.name, {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5, 0)

    this.oiBalloonBg = scene.add.rectangle(px, py - 38, 36, 18, 0xffffff, 0.9)
      .setStrokeStyle(2, 0x000000)
      .setVisible(false)
      .setDepth(150)
    this.oiBalloonText = scene.add.text(px, py - 38, 'Oi!', {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      color: '#000000',
    }).setOrigin(0.5, 0.5).setVisible(false).setDepth(151)

    // Thought bubble (shows NPC thinking process during work)
    this.thoughtBg = scene.add.rectangle(px, py - 52, 200, 20, 0x1a1a2e, 0.95)
      .setStrokeStyle(2, 0x66aaff)
      .setVisible(false)
      .setDepth(160)
    this.thoughtText = scene.add.text(px, py - 52, '', {
      fontFamily: '"Press Start 2P"',
      fontSize: '7px',
      color: '#aaccff',
    }).setOrigin(0.5, 0.5).setVisible(false).setDepth(161)
  }

  // ========== DIRECTION ==========

  faceDirection(targetX: number, targetY: number): void {
    const dx = targetX - this.x
    const dy = targetY - this.y
    let dir: string

    if (Math.abs(dx) > Math.abs(dy)) {
      dir = dx > 0 ? 'right' : 'left'
    } else {
      dir = dy > 0 ? 'down' : 'up'
    }

    if (dir !== this.currentDir) {
      this.currentDir = dir
      this.setTexture(`npc-${this.agentDef.id}-${dir}`)
    }
  }

  // ========== ATTACHMENTS ==========

  private updateAttachments(): void {
    this.statusBubble.setPosition(this.x, this.y - 24)
    this.nameLabel.setPosition(this.x, this.y + TILE_SIZE / 2 + 4)
    if (this.oiBalloonBg) this.oiBalloonBg.setPosition(this.x, this.y - 38)
    if (this.oiBalloonText) this.oiBalloonText.setPosition(this.x, this.y - 38)
    if (this.thoughtBg) this.thoughtBg.setPosition(this.x, this.y - 52)
    if (this.thoughtText) this.thoughtText.setPosition(this.x, this.y - 52)
  }

  updateAttachmentsPublic(): void {
    this.updateAttachments()
  }

  stopIdleBob(): void { /* no-op */ }
  restartIdleBob(): void { /* no-op */ }

  // ========== PATH WALKING ==========

  private walkPath(targetTileX: number, targetTileY: number, onComplete: () => void): void {
    const from = pixelToTile(this.x, this.y, TILE_SIZE)
    const path = findPath(from.x, from.y, targetTileX, targetTileY, this.agentDef.id)

    if (path.length === 0) {
      onComplete()
      return
    }

    this.pathQueue = path
    this.pathCallback = onComplete
    this.walkNextPathStep()
  }

  private walkNextPathStep(): void {
    if (this.pathQueue.length === 0) {
      this.currentPathTween = null
      this.pathCallback?.()
      this.pathCallback = null
      return
    }

    const nextTile = this.pathQueue.shift()!
    const target = tileToPixel(nextTile.x, nextTile.y, TILE_SIZE)

    // Face the direction we're moving
    this.faceDirection(target.x, target.y)

    // Emit door event
    this.scene.game.events.emit('npc-on-tile', nextTile.x, nextTile.y)

    // Update occupied tile
    unregisterOccupied(this.currentTileX, this.currentTileY, this.agentDef.id)
    this.currentTileX = nextTile.x
    this.currentTileY = nextTile.y
    registerOccupied(this.currentTileX, this.currentTileY, this.agentDef.id)

    this.currentPathTween = this.scene.tweens.add({
      targets: this,
      x: target.x,
      y: target.y,
      duration: 250,
      ease: 'Linear',
      onUpdate: () => this.updateAttachments(),
      onComplete: () => {
        this.currentPathTween = null
        this.walkNextPathStep()
      },
    })
  }

  private stopPathWalking(): void {
    this.pathQueue = []
    this.pathCallback = null
    if (this.currentPathTween) {
      this.currentPathTween.destroy()
      this.currentPathTween = null
    }
  }

  // ========== ACTIONS ==========

  walkToDesk(): void {
    if (this.npcState === 'working' || this.npcState === 'walking-to-desk') return
    this.stopPathWalking()
    this.stopTyping()
    this.npcState = 'walking-to-desk'

    const deskTile = pixelToTile(this.deskX, this.deskY, TILE_SIZE)
    this.walkPath(deskTile.x, deskTile.y, () => {
      this.startTyping()
      this.updateAttachments()
    })
  }

  walkHome(): void {
    if (this.npcState === 'walking-home') return
    this.stopPathWalking()
    this.stopTyping()
    this.npcState = 'walking-home'

    const homeTile = pixelToTile(this.homeX, this.homeY, TILE_SIZE)
    this.walkPath(homeTile.x, homeTile.y, () => {
      this.npcState = 'idle'
      this.faceDirection(this.x, this.y + 1) // face down when home
      this.updateAttachments()
    })
  }

  walkToAgent(targetNpc: AgentNPC, onArrive: () => void): void {
    this.stopPathWalking()
    this.stopTyping()
    this.npcState = 'walking-to-agent'

    const targetTile = pixelToTile(targetNpc.homeX, targetNpc.homeY, TILE_SIZE)
    const adjacentTile = { x: targetTile.x + 1, y: targetTile.y }

    this.walkPath(adjacentTile.x, adjacentTile.y, () => {
      this.npcState = 'visiting'
      this.faceDirection(targetNpc.x, targetNpc.y)
      this.updateAttachments()
      onArrive()
    })
  }

  private startTyping(): void {
    this.npcState = 'working'
    this.typingTween = this.scene.tweens.add({
      targets: this,
      x: this.x + 1,
      duration: 150,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
  }

  private stopTyping(): void {
    if (this.typingTween) {
      this.typingTween.destroy()
      this.typingTween = null
    }
  }

  // ========== PLAYER PROXIMITY ==========

  onPlayerNear(): void {
    if (this.playerNearby) return
    this.playerNearby = true

    // Don't interrupt if NPC is reporting task completion
    if (this.npcState === 'reporting' || this.npcState === 'walking-to-player') return

    this.idleBehavior?.pauseForPlayer()

    this.oiBalloonBg?.setVisible(true).setAlpha(0)
    this.oiBalloonText?.setVisible(true).setAlpha(0)
    this.scene.tweens.add({
      targets: [this.oiBalloonBg, this.oiBalloonText],
      alpha: 1,
      duration: 300,
      ease: 'Power2',
    })
  }

  onPlayerLeft(): void {
    if (!this.playerNearby) return
    this.playerNearby = false

    // Don't hide balloon if NPC is reporting task completion
    if (this.npcState === 'reporting' || this.npcState === 'walking-to-player') return

    this.scene.tweens.add({
      targets: [this.oiBalloonBg, this.oiBalloonText],
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        this.oiBalloonBg?.setVisible(false)
        this.oiBalloonText?.setVisible(false)
      },
    })
    this.idleBehavior?.resumeFromPlayer()
  }

  // ========== WALK TO PLAYER ==========

  walkToPlayer(playerX: number, playerY: number): void {
    this.stopPathWalking()
    this.stopTyping()
    this.npcState = 'walking-to-player'

    const playerTile = pixelToTile(playerX, playerY, TILE_SIZE)
    const from = pixelToTile(this.x, this.y, TILE_SIZE)

    // Find a free tile adjacent to player (queue/line up if others are already there)
    const adjacentOffsets = [
      { x: 0, y: 1 },  // below
      { x: 1, y: 0 },  // right
      { x: -1, y: 0 }, // left
      { x: 0, y: -1 }, // above
      { x: 1, y: 1 },  // diagonal fallbacks
      { x: -1, y: 1 },
      { x: 1, y: -1 },
      { x: -1, y: -1 },
      { x: 0, y: 2 },  // further away (queue)
      { x: 0, y: -2 },
      { x: 2, y: 0 },
      { x: -2, y: 0 },
    ]

    let targetTile = { x: playerTile.x, y: playerTile.y + 1 } // default: below player
    for (const off of adjacentOffsets) {
      const tx = playerTile.x + off.x
      const ty = playerTile.y + off.y
      if (!isTileOccupied(tx, ty, this.agentDef.id)) {
        targetTile = { x: tx, y: ty }
        break
      }
    }

    const path = findPath(from.x, from.y, targetTile.x, targetTile.y, this.agentDef.id)

    if (path.length === 0) {
      this.showDoneBalloon()
      return
    }

    this.pathQueue = path
    this.pathCallback = () => {
      this.npcState = 'reporting'
      this.faceDirection(playerX, playerY)
      this.updateAttachments()
      this.showDoneBalloon()
    }
    this.walkNextPathStep()
  }

  private showDoneBalloon(): void {
    if (this.oiBalloonText && this.oiBalloonBg) {
      this.oiBalloonText.setText('Terminei!')
      this.oiBalloonBg.setSize(72, 18)
      this.oiBalloonBg.setVisible(true).setAlpha(0)
      this.oiBalloonText.setVisible(true).setAlpha(0)
      this.scene.tweens.add({
        targets: [this.oiBalloonBg, this.oiBalloonText],
        alpha: 1,
        duration: 300,
        ease: 'Power2',
      })
    }
  }

  hideDoneBalloon(): void {
    if (this.oiBalloonText && this.oiBalloonBg) {
      this.oiBalloonBg.setVisible(false)
      this.oiBalloonText.setVisible(false)
      this.oiBalloonText.setText('Oi!')
      this.oiBalloonBg.setSize(36, 18)
    }
  }

  // ========== THOUGHT BUBBLE ==========

  startThinking(role: string): void {
    const thinkingMessages: Record<string, string[]> = {
      coder: [
        'Lendo codigo...',
        'Analisando estrutura...',
        'Planejando mudancas...',
        'Escrevendo codigo...',
        'Testando logica...',
        'Refatorando...',
        'Otimizando...',
        'Finalizando...',
      ],
      researcher: [
        'Pesquisando...',
        'Analisando fontes...',
        'Comparando dados...',
        'Organizando info...',
        'Documentando...',
        'Revisando...',
        'Finalizando...',
      ],
      tester: [
        'Preparando testes...',
        'Executando suite...',
        'Verificando output...',
        'Analisando cobertura...',
        'Reportando bugs...',
        'Validando fix...',
        'Finalizando...',
      ],
      designer: [
        'Analisando layout...',
        'Criando wireframe...',
        'Definindo cores...',
        'Ajustando tipografia...',
        'Prototipando...',
        'Revisando UX...',
        'Finalizando...',
      ],
    }

    this.thoughtMessages = thinkingMessages[role] || thinkingMessages.coder
    this.thoughtIndex = 0

    if (this.thoughtBg && this.thoughtText) {
      this.thoughtBg.setVisible(true).setAlpha(0)
      this.thoughtText.setVisible(true).setAlpha(0)
      this.thoughtText.setText(this.thoughtMessages[0])
      this.scene.tweens.add({
        targets: [this.thoughtBg, this.thoughtText],
        alpha: 1,
        duration: 300,
      })
    }

    // Cycle through messages
    this.thoughtTimer = setInterval(() => {
      this.thoughtIndex = (this.thoughtIndex + 1) % this.thoughtMessages.length
      if (this.thoughtText) {
        // Fade out old text, change, fade in
        this.scene.tweens.add({
          targets: this.thoughtText,
          alpha: 0,
          duration: 200,
          onComplete: () => {
            this.thoughtText?.setText(this.thoughtMessages[this.thoughtIndex])
            this.scene.tweens.add({
              targets: this.thoughtText,
              alpha: 1,
              duration: 200,
            })
          },
        })
      }
    }, 2000)
  }

  stopThinking(): void {
    if (this.thoughtTimer) {
      clearInterval(this.thoughtTimer)
      this.thoughtTimer = null
    }
    if (this.thoughtBg && this.thoughtText) {
      this.scene.tweens.add({
        targets: [this.thoughtBg, this.thoughtText],
        alpha: 0,
        duration: 300,
        onComplete: () => {
          this.thoughtBg?.setVisible(false)
          this.thoughtText?.setVisible(false)
        },
      })
    }
  }

  // ========== STATUS ==========

  setAgentStatus(status: AgentStatus): void {
    this.statusBubble.setStatus(status)

    if (status === 'thinking') {
      this.idleBehavior?.pause()
      this.stopPathWalking()
      this.startThinking(this.agentDef.role)
    } else if (status === 'working') {
      this.idleBehavior?.pause()
      this.hideDoneBalloon()
      this.startThinking(this.agentDef.role)
      this.walkToDesk()
    } else if (status === 'done' || status === 'error') {
      this.stopThinking()
      this.scene.game.events.emit('npc-task-done-find-player', this.agentDef.id)
    } else if (status === 'idle') {
      this.stopThinking()
      this.hideDoneBalloon()
      this.walkHome()
      window.setTimeout(() => {
        this.idleBehavior?.resume()
      }, 3000)
    }
  }

  getState(): NPCState {
    return this.npcState
  }
}
