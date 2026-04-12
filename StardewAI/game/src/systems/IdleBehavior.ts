import Phaser from 'phaser'
import { AgentNPC } from '../entities/AgentNPC'
import { TILE_SIZE } from '../config'

// Points of interest where NPCs can wander to
const CAMPFIRE_POS = { x: 19 * TILE_SIZE + TILE_SIZE / 2, y: 15 * TILE_SIZE + TILE_SIZE / 2 }

const WANDER_POINTS = [
  { x: 15, y: 10 },
  { x: 25, y: 10 },
  { x: 15, y: 18 },
  { x: 25, y: 18 },
  { x: 19, y: 12 },
  { x: 19, y: 17 },
  { x: 12, y: 14 },
  { x: 27, y: 14 },
].map(p => ({ x: p.x * TILE_SIZE + TILE_SIZE / 2, y: p.y * TILE_SIZE + TILE_SIZE / 2 }))

type IdleState = 'home' | 'deciding' | 'walking-out' | 'resting' | 'walking-back'

export class IdleBehavior {
  private scene: Phaser.Scene
  private npc: AgentNPC
  private state: IdleState = 'home'
  private active = true
  private currentTween: Phaser.Tweens.Tween | null = null
  private timer: ReturnType<typeof setTimeout> | null = null
  private restingTween: Phaser.Tweens.Tween | null = null

  constructor(scene: Phaser.Scene, npc: AgentNPC) {
    this.scene = scene
    this.npc = npc
    // Start first decision after random delay (stagger NPCs)
    this.scheduleNextDecision(3000 + Math.random() * 5000)
  }

  private scheduleNextDecision(delay: number): void {
    this.clearTimer()
    this.timer = setTimeout(() => {
      if (this.active && this.npc.getState() === 'idle') {
        this.decide()
      } else {
        // Retry later if busy
        this.scheduleNextDecision(3000 + Math.random() * 3000)
      }
    }, delay)
  }

  private decide(): void {
    this.state = 'deciding'

    // 40% campfire, 60% random wander point
    const goToCampfire = Math.random() < 0.4
    let targetX: number
    let targetY: number

    if (goToCampfire) {
      const offset = (Math.random() - 0.5) * 30
      targetX = CAMPFIRE_POS.x + offset
      targetY = CAMPFIRE_POS.y + 16 + Math.random() * 16
    } else {
      const point = WANDER_POINTS[Math.floor(Math.random() * WANDER_POINTS.length)]
      targetX = point.x + (Math.random() - 0.5) * 20
      targetY = point.y + (Math.random() - 0.5) * 20
    }

    this.walkTo(targetX, targetY, () => {
      this.state = 'resting'
      this.startRestAnimation()
      const restDuration = 5000 + Math.random() * 10000
      this.timer = setTimeout(() => {
        this.stopRestAnimation()
        this.walkHome()
      }, restDuration)
    })
  }

  private walkTo(x: number, y: number, onComplete: () => void): void {
    this.state = 'walking-out'
    const dist = Phaser.Math.Distance.Between(this.npc.x, this.npc.y, x, y)
    const duration = Math.max(800, dist * 5) // Slow leisurely walk

    this.currentTween = this.scene.tweens.add({
      targets: this.npc,
      x, y,
      duration,
      ease: 'Sine.easeInOut',
      onUpdate: () => this.npc.updateAttachmentsPublic(),
      onComplete: () => {
        this.currentTween = null
        onComplete()
      },
    })
  }

  private walkHome(): void {
    this.state = 'walking-back'
    const dist = Phaser.Math.Distance.Between(this.npc.x, this.npc.y, this.npc.homeX, this.npc.homeY)
    const duration = Math.max(800, dist * 5)

    this.currentTween = this.scene.tweens.add({
      targets: this.npc,
      x: this.npc.homeX,
      y: this.npc.homeY,
      duration,
      ease: 'Sine.easeInOut',
      onUpdate: () => this.npc.updateAttachmentsPublic(),
      onComplete: () => {
        this.currentTween = null
        this.state = 'home'
        this.npc.restartIdleBob()
        this.npc.updateAttachmentsPublic()
        // Schedule next roam
        this.scheduleNextDecision(4000 + Math.random() * 6000)
      },
    })
  }

  private startRestAnimation(): void {
    // Gentle bob while resting (slower than idle)
    this.restingTween = this.scene.tweens.add({
      targets: this.npc,
      y: this.npc.y - 1,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onUpdate: () => this.npc.updateAttachmentsPublic(),
    })
  }

  private stopRestAnimation(): void {
    if (this.restingTween) {
      this.restingTween.destroy()
      this.restingTween = null
    }
  }

  /** Stop all roaming immediately (task assigned) */
  pause(): void {
    this.active = false
    this.clearTimer()
    this.stopRestAnimation()
    if (this.currentTween) {
      this.currentTween.destroy()
      this.currentTween = null
    }
    this.state = 'home'
  }

  /** Resume roaming (task done + dismissed) */
  resume(): void {
    this.active = true
    this.state = 'home'
    this.scheduleNextDecision(2000 + Math.random() * 3000)
  }

  isRoaming(): boolean {
    return this.state !== 'home'
  }

  private clearTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }

  destroy(): void {
    this.pause()
  }
}
