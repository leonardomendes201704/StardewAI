import Phaser from 'phaser'
import { AgentDefinition, AgentStatus } from '../types'
import { TILE_SIZE } from '../config'
import { StatusBubble } from '../ui/StatusBubble'
import { IdleBehavior } from '../systems/IdleBehavior'

export function generateNPCTexture(scene: Phaser.Scene, id: string, color: number): void {
  const gfx = scene.add.graphics()

  // Body
  gfx.fillStyle(color, 1)
  gfx.fillRect(8, 10, 16, 16)

  // Head
  gfx.fillStyle(0xffcc99, 1)
  gfx.fillRect(10, 2, 12, 10)

  // Hair/hat in agent color
  gfx.fillStyle(color, 1)
  gfx.fillRect(9, 1, 14, 4)

  // Eyes
  gfx.fillStyle(0x000000, 1)
  gfx.fillRect(12, 7, 2, 2)
  gfx.fillRect(18, 7, 2, 2)

  // Smile
  gfx.fillStyle(0x000000, 1)
  gfx.fillRect(13, 10, 6, 1)

  // Legs
  gfx.fillStyle(darken(color), 1)
  gfx.fillRect(10, 26, 5, 4)
  gfx.fillRect(17, 26, 5, 4)

  gfx.generateTexture(`npc-${id}`, TILE_SIZE, TILE_SIZE)
  gfx.destroy()
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

  // Positions
  public homeX: number
  public homeY: number
  public deskX: number
  public deskY: number

  // State
  private npcState: NPCState = 'idle'
  private idleTween: Phaser.Tweens.Tween | null = null
  private typingTween: Phaser.Tweens.Tween | null = null
  private idleBehavior: IdleBehavior | null = null

  constructor(scene: Phaser.Scene, def: AgentDefinition) {
    const px = def.tileX * TILE_SIZE + TILE_SIZE / 2
    const py = def.tileY * TILE_SIZE + TILE_SIZE / 2

    super(scene, px, py, `npc-${def.id}`)
    this.agentDef = def

    // Store positions
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

    // Start idle animation
    this.startIdle()

    // Start autonomous roaming behavior
    this.idleBehavior = new IdleBehavior(scene, this)

    // Status bubble
    this.statusBubble = new StatusBubble(scene, px, py)

    // Name label
    this.nameLabel = scene.add.text(px, py + TILE_SIZE / 2 + 4, def.name, {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5, 0)
  }

  private startIdle(): void {
    this.stopAllTweens()
    this.npcState = 'idle'
    // No idle tween here — IdleBehavior handles all movement
    // Just ensure NPC is at home position
  }

  private startTyping(): void {
    this.stopAllTweens()
    this.npcState = 'working'
    this.typingTween = this.scene.tweens.add({
      targets: this,
      x: this.deskX + 1,
      duration: 150,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
  }

  private stopAllTweens(): void {
    if (this.idleTween) {
      this.idleTween.destroy()
      this.idleTween = null
    }
    if (this.typingTween) {
      this.typingTween.destroy()
      this.typingTween = null
    }
  }

  private updateAttachments(): void {
    this.statusBubble.setPosition(this.x, this.y - 24)
    this.nameLabel.setPosition(this.x, this.y + TILE_SIZE / 2 + 4)
  }

  /** Public version for IdleBehavior to call */
  updateAttachmentsPublic(): void {
    this.updateAttachments()
  }

  /** Stop any NPC tweens so IdleBehavior can move freely */
  stopIdleBob(): void {
    this.stopAllTweens()
  }

  /** Called when NPC returns home from roaming */
  restartIdleBob(): void {
    // Nothing to restart — idle is now a static state
    // IdleBehavior handles the roaming cycle
  }

  walkToDesk(): void {
    if (this.npcState === 'working' || this.npcState === 'walking-to-desk') return
    this.stopAllTweens()
    this.npcState = 'walking-to-desk'

    this.scene.tweens.add({
      targets: this,
      x: this.deskX,
      y: this.deskY,
      duration: 800,
      ease: 'Power2',
      onUpdate: () => this.updateAttachments(),
      onComplete: () => {
        this.startTyping()
        this.updateAttachments()
      },
    })
  }

  walkHome(): void {
    if (this.npcState === 'idle' || this.npcState === 'walking-home') return
    this.stopAllTweens()
    this.npcState = 'walking-home'

    this.scene.tweens.add({
      targets: this,
      x: this.homeX,
      y: this.homeY,
      duration: 800,
      ease: 'Power2',
      onUpdate: () => this.updateAttachments(),
      onComplete: () => {
        this.startIdle()
        this.updateAttachments()
      },
    })
  }

  walkToAgent(targetNpc: AgentNPC, onArrive: () => void): void {
    this.stopAllTweens()
    this.npcState = 'walking-to-agent'

    // Walk to near the target NPC (offset slightly so they don't overlap)
    const targetX = targetNpc.homeX + 20
    const targetY = targetNpc.homeY

    // Calculate duration based on distance
    const dist = Phaser.Math.Distance.Between(this.x, this.y, targetX, targetY)
    const duration = Math.max(1000, dist * 4)

    this.scene.tweens.add({
      targets: this,
      x: targetX,
      y: targetY,
      duration,
      ease: 'Power1',
      onUpdate: () => this.updateAttachments(),
      onComplete: () => {
        this.npcState = 'visiting'
        this.updateAttachments()
        onArrive()
      },
    })
  }

  setAgentStatus(status: AgentStatus): void {
    this.statusBubble.setStatus(status)

    if (status === 'working') {
      // Pause roaming and go to desk
      this.idleBehavior?.pause()
      this.walkToDesk()
    } else if (status === 'done' || status === 'error') {
      // Walk home but don't resume roaming yet (wait for dismiss)
      if (this.npcState !== 'idle' && this.npcState !== 'walking-home') {
        this.walkHome()
      }
    } else if (status === 'idle') {
      // Task dismissed - resume roaming
      if (this.npcState !== 'idle' && this.npcState !== 'walking-home') {
        this.walkHome()
      }
      // Resume autonomous behavior after getting home
      window.setTimeout(() => {
        this.idleBehavior?.resume()
      }, 1500)
    }
  }

  getState(): NPCState {
    return this.npcState
  }
}
