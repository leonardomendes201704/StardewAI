import Phaser from 'phaser'
import { AgentStatus } from '../types'

export function generateStatusTextures(scene: Phaser.Scene): void {
  const size = 16

  // Idle - gray Z's
  const idleGfx = scene.add.graphics()
  idleGfx.fillStyle(0x888888, 0.8)
  idleGfx.fillCircle(size / 2, size / 2, size / 2 - 1)
  idleGfx.fillStyle(0xffffff, 1)
  idleGfx.fillRect(4, 4, 6, 2)
  idleGfx.fillRect(8, 6, 2, 2)
  idleGfx.fillRect(6, 8, 2, 2)
  idleGfx.fillRect(4, 10, 6, 2)
  idleGfx.generateTexture('status-idle', size, size)
  idleGfx.destroy()

  // Working - orange gear
  const workGfx = scene.add.graphics()
  workGfx.fillStyle(0xff8800, 0.9)
  workGfx.fillCircle(size / 2, size / 2, size / 2 - 1)
  workGfx.fillStyle(0xffffff, 1)
  workGfx.fillCircle(size / 2, size / 2, 3)
  workGfx.fillStyle(0xff8800, 1)
  workGfx.fillCircle(size / 2, size / 2, 1)
  workGfx.fillStyle(0xffffff, 1)
  workGfx.fillRect(size / 2 - 1, 1, 2, 3)
  workGfx.fillRect(size / 2 - 1, size - 4, 2, 3)
  workGfx.fillRect(1, size / 2 - 1, 3, 2)
  workGfx.fillRect(size - 4, size / 2 - 1, 3, 2)
  workGfx.generateTexture('status-working', size, size)
  workGfx.destroy()

  // Done - green check
  const doneGfx = scene.add.graphics()
  doneGfx.fillStyle(0x44cc44, 0.9)
  doneGfx.fillCircle(size / 2, size / 2, size / 2 - 1)
  doneGfx.fillStyle(0xffffff, 1)
  doneGfx.fillRect(4, 8, 2, 2)
  doneGfx.fillRect(6, 10, 2, 2)
  doneGfx.fillRect(8, 8, 2, 2)
  doneGfx.fillRect(10, 6, 2, 2)
  doneGfx.fillRect(12, 4, 2, 2)
  doneGfx.generateTexture('status-done', size, size)
  doneGfx.destroy()

  // Error - red X
  const errGfx = scene.add.graphics()
  errGfx.fillStyle(0xff3333, 0.9)
  errGfx.fillCircle(size / 2, size / 2, size / 2 - 1)
  errGfx.fillStyle(0xffffff, 1)
  errGfx.fillRect(4, 4, 2, 2)
  errGfx.fillRect(6, 6, 2, 2)
  errGfx.fillRect(8, 8, 2, 2)
  errGfx.fillRect(10, 10, 2, 2)
  errGfx.fillRect(10, 4, 2, 2)
  errGfx.fillRect(8, 6, 2, 2)
  errGfx.fillRect(6, 8, 2, 2)
  errGfx.fillRect(4, 10, 2, 2)
  errGfx.generateTexture('status-error', size, size)
  errGfx.destroy()
}

export class StatusBubble extends Phaser.GameObjects.Container {
  private bubble: Phaser.GameObjects.Image
  private rotateTween?: Phaser.Tweens.Tween
  private currentStatus: AgentStatus = 'idle'
  private floatOffset = 0

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y - 24)

    this.bubble = scene.add.image(0, 0, 'status-idle')
    this.add(this.bubble)
    scene.add.existing(this)

    // Float the bubble image up/down (relative, not absolute position)
    scene.tweens.add({
      targets: this,
      floatOffset: -4,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        this.bubble.y = this.floatOffset
      },
    })
  }

  setStatus(status: AgentStatus): void {
    if (status === this.currentStatus) return
    this.currentStatus = status

    this.rotateTween?.destroy()

    const textureMap: Record<AgentStatus, string> = {
      idle: 'status-idle',
      working: 'status-working',
      done: 'status-done',
      error: 'status-error',
    }
    this.bubble.setTexture(textureMap[status])

    if (status === 'working') {
      this.rotateTween = this.scene.tweens.add({
        targets: this.bubble,
        angle: 360,
        duration: 2000,
        repeat: -1,
        ease: 'Linear',
      })
    } else {
      this.bubble.setAngle(0)
    }

    if (status === 'done') {
      this.scene.tweens.add({
        targets: this.bubble,
        scaleX: 1.5,
        scaleY: 1.5,
        duration: 200,
        yoyo: true,
        ease: 'Back.easeOut',
      })
    }
  }

  getStatus(): AgentStatus {
    return this.currentStatus
  }
}
