import Phaser from 'phaser'
import { AgentNPC } from '../entities/AgentNPC'
import { TILE_SIZE } from '../config'
import { findPath, pixelToTile, tileToPixel } from './Pathfinder'

const CAMPFIRE_TILE = { x: 19, y: 15 }

const WANDER_TILES = [
  { x: 15, y: 10 }, { x: 25, y: 10 },
  { x: 15, y: 18 }, { x: 25, y: 18 },
  { x: 19, y: 12 }, { x: 19, y: 17 },
  { x: 12, y: 14 }, { x: 27, y: 14 },
]

type IdleState = 'home' | 'deciding' | 'walking' | 'resting' | 'walking-back' | 'paused-by-player'

export class IdleBehavior {
  private scene: Phaser.Scene
  private npc: AgentNPC
  public state: IdleState = 'home'
  public active = true
  private currentTween: Phaser.Tweens.Tween | null = null
  public timer: ReturnType<typeof setTimeout> | null = null
  private restingTween: Phaser.Tweens.Tween | null = null
  private pathQueue: { x: number; y: number }[] = []
  private walkingCallback: (() => void) | null = null

  constructor(scene: Phaser.Scene, npc: AgentNPC) {
    this.scene = scene
    this.npc = npc
    this.scheduleNextDecision(3000 + Math.random() * 5000)
  }

  private scheduleNextDecision(delay: number): void {
    this.clearTimer()
    this.timer = setTimeout(() => {
      if (this.active && this.npc.getState() === 'idle' && this.state !== 'paused-by-player') {
        this.decide()
      } else {
        this.scheduleNextDecision(3000 + Math.random() * 3000)
      }
    }, delay)
  }

  private decide(): void {
    this.state = 'deciding'

    // Choose destination tile
    let targetTile: { x: number; y: number }

    if (Math.random() < 0.4) {
      // Go near campfire
      const offsets = [{ x: 0, y: 1 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 2 }]
      const off = offsets[Math.floor(Math.random() * offsets.length)]
      targetTile = { x: CAMPFIRE_TILE.x + off.x, y: CAMPFIRE_TILE.y + off.y }
    } else {
      targetTile = WANDER_TILES[Math.floor(Math.random() * WANDER_TILES.length)]
    }

    const from = pixelToTile(this.npc.x, this.npc.y, TILE_SIZE)
    const path = findPath(from.x, from.y, targetTile.x, targetTile.y, this.npc.agentDef.id)

    if (path.length === 0) {
      // No path, try again later
      this.state = 'home'
      this.scheduleNextDecision(2000 + Math.random() * 3000)
      return
    }

    this.walkAlongPath(path, () => {
      this.state = 'resting'
      this.startRestAnimation()
      const restDuration = 5000 + Math.random() * 10000
      this.timer = setTimeout(() => {
        this.stopRestAnimation()
        this.goHome()
      }, restDuration)
    })
  }

  private goHome(): void {
    this.state = 'walking-back'
    const from = pixelToTile(this.npc.x, this.npc.y, TILE_SIZE)
    const homeTile = pixelToTile(this.npc.homeX, this.npc.homeY, TILE_SIZE)
    const path = findPath(from.x, from.y, homeTile.x, homeTile.y, this.npc.agentDef.id)

    if (path.length === 0) {
      // Already home or can't reach
      this.state = 'home'
      this.npc.updateAttachmentsPublic()
      this.scheduleNextDecision(4000 + Math.random() * 6000)
      return
    }

    this.walkAlongPath(path, () => {
      this.state = 'home'
      this.npc.updateAttachmentsPublic()
      this.scheduleNextDecision(4000 + Math.random() * 6000)
    })
  }

  /** Walk tile-by-tile along a path */
  private walkAlongPath(path: { x: number; y: number }[], onComplete: () => void): void {
    this.pathQueue = [...path]
    this.walkingCallback = onComplete
    this.state = this.state === 'walking-back' ? 'walking-back' : 'walking'
    this.walkNextStep()
  }

  private walkNextStep(): void {
    if (!this.active || this.state === 'paused-by-player') return

    if (this.pathQueue.length === 0) {
      this.currentTween = null
      this.walkingCallback?.()
      this.walkingCallback = null
      return
    }

    const nextTile = this.pathQueue.shift()!
    const target = tileToPixel(nextTile.x, nextTile.y, TILE_SIZE)

    // Face the direction of movement
    this.npc.faceDirection(target.x, target.y)

    this.currentTween = this.scene.tweens.add({
      targets: this.npc,
      x: target.x,
      y: target.y,
      duration: 280,
      ease: 'Linear',
      onUpdate: () => this.npc.updateAttachmentsPublic(),
      onComplete: () => {
        this.currentTween = null
        this.walkNextStep()
      },
    })
  }

  private startRestAnimation(): void {
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

  /** Player is nearby — freeze */
  pauseForPlayer(): void {
    if (this.state === 'home' || this.state === 'paused-by-player') return
    const prevState = this.state
    this.state = 'paused-by-player'
    this.clearTimer()
    this.stopRestAnimation()
    if (this.currentTween) {
      this.currentTween.destroy()
      this.currentTween = null
    }
    // Keep pathQueue so we can resume
    this._prevState = prevState
  }

  private _prevState: IdleState = 'home'

  /** Player left — resume */
  resumeFromPlayer(): void {
    if (this.state !== 'paused-by-player') return

    if (this.pathQueue.length > 0) {
      // Resume walking the remaining path
      this.state = this._prevState === 'walking-back' ? 'walking-back' : 'walking'
      this.walkNextStep()
    } else if (this._prevState === 'resting') {
      // Was resting, resume rest
      this.state = 'resting'
      this.startRestAnimation()
      this.timer = setTimeout(() => {
        this.stopRestAnimation()
        this.goHome()
      }, 3000 + Math.random() * 5000)
    } else {
      this.state = 'home'
      this.scheduleNextDecision(2000 + Math.random() * 3000)
    }
  }

  /** Stop all roaming (task assigned) */
  pause(): void {
    this.active = false
    this.clearTimer()
    this.stopRestAnimation()
    this.pathQueue = []
    this.walkingCallback = null
    if (this.currentTween) {
      this.currentTween.destroy()
      this.currentTween = null
    }
    this.state = 'home'
  }

  /** Resume roaming (task dismissed) */
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
