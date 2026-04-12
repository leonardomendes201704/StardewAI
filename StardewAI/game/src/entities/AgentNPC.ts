import Phaser from 'phaser'
import { AgentDefinition, AgentStatus } from '../types'
import { TILE_SIZE } from '../config'
import { StatusBubble } from '../ui/StatusBubble'
import { IdleBehavior } from '../systems/IdleBehavior'
import { findPath, pixelToTile, tileToPixel } from '../systems/Pathfinder'

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

type NPCState = 'idle' | 'walking-to-desk' | 'working' | 'walking-home' | 'walking-to-agent' | 'visiting'

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

  // "Oi" balloon
  private oiBalloonBg: Phaser.GameObjects.Rectangle | null = null
  private oiBalloonText: Phaser.GameObjects.Text | null = null
  private playerNearby = false

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
  }

  // ========== DIRECTION ==========

  private faceDirection(targetX: number, targetY: number): void {
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
  }

  updateAttachmentsPublic(): void {
    this.updateAttachments()
  }

  stopIdleBob(): void { /* no-op */ }
  restartIdleBob(): void { /* no-op */ }

  // ========== PATH WALKING ==========

  private walkPath(targetTileX: number, targetTileY: number, onComplete: () => void): void {
    const from = pixelToTile(this.x, this.y, TILE_SIZE)
    const path = findPath(from.x, from.y, targetTileX, targetTileY)

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

    // Emit door event if this tile is a door
    this.scene.game.events.emit('npc-on-tile', nextTile.x, nextTile.y)

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
    if (this.npcState === 'idle' || this.npcState === 'walking-home') return
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

  // ========== STATUS ==========

  setAgentStatus(status: AgentStatus): void {
    this.statusBubble.setStatus(status)

    if (status === 'working') {
      this.idleBehavior?.pause()
      this.walkToDesk()
    } else if (status === 'done' || status === 'error') {
      if (this.npcState !== 'idle' && this.npcState !== 'walking-home') {
        this.walkHome()
      }
    } else if (status === 'idle') {
      if (this.npcState !== 'idle' && this.npcState !== 'walking-home') {
        this.walkHome()
      }
      window.setTimeout(() => {
        this.idleBehavior?.resume()
      }, 1500)
    }
  }

  getState(): NPCState {
    return this.npcState
  }
}
