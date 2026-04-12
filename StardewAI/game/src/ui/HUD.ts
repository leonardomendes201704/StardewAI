import Phaser from 'phaser'
import { GAME_WIDTH } from '../config'

export class HUD extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Rectangle
  private taskText: Phaser.GameObjects.Text
  private clockText: Phaser.GameObjects.Text
  private titleText: Phaser.GameObjects.Text
  private gameTime = 0

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0)

    // Top bar background
    this.bg = scene.add.rectangle(GAME_WIDTH / 2, 16, GAME_WIDTH, 32, 0x1a1a2e, 0.85)
    this.add(this.bg)

    // Title
    this.titleText = scene.add.text(GAME_WIDTH / 2, 16, 'StardewAI', {
      fontFamily: '"Press Start 2P"',
      fontSize: '10px',
      color: '#88aaff',
    })
    this.titleText.setOrigin(0.5, 0.5)
    this.add(this.titleText)

    // Task counter (left)
    this.taskText = scene.add.text(12, 10, 'Tarefas: 0', {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      color: '#ffffff',
    })
    this.add(this.taskText)

    // Clock (right)
    this.clockText = scene.add.text(GAME_WIDTH - 12, 10, '06:00', {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      color: '#ffcc88',
    })
    this.clockText.setOrigin(1, 0)
    this.add(this.clockText)

    scene.add.existing(this)
    this.setDepth(50)
  }

  updateTasks(active: number, total: number): void {
    this.taskText.setText(`Tarefas: ${active} ativas / ${total} total`)
  }

  update(_time: number, delta: number): void {
    // Cosmetic clock running at 60x speed
    this.gameTime += delta * 60
    const totalMinutes = Math.floor(this.gameTime / 60000) % (24 * 60)
    const hours = Math.floor(totalMinutes / 60) + 6 // Start at 6am
    const minutes = totalMinutes % 60
    const h = (hours % 24).toString().padStart(2, '0')
    const m = minutes.toString().padStart(2, '0')
    this.clockText.setText(`${h}:${m}`)
  }
}
