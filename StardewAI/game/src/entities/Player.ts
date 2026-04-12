import Phaser from 'phaser'
import { TILE_SIZE, PLAYER_SPEED } from '../config'

// Generate 4 separate textures for each direction
export function generatePlayerTexture(scene: Phaser.Scene): void {
  const dirs = ['down', 'left', 'right', 'up']

  for (let row = 0; row < 4; row++) {
    const gfx = scene.add.graphics()
    const dir = dirs[row]

    // Body
    gfx.fillStyle(0x3366cc, 1)
    gfx.fillRect(8, 10, 16, 16)

    // Head
    gfx.fillStyle(0xffcc99, 1)
    gfx.fillRect(10, 2, 12, 10)

    // Hair
    gfx.fillStyle(0x4a3220, 1)
    gfx.fillRect(10, 1, 12, 4)

    // Eyes based on direction
    gfx.fillStyle(0x000000, 1)
    if (row === 0) {
      // Down - two eyes
      gfx.fillRect(12, 7, 2, 2)
      gfx.fillRect(18, 7, 2, 2)
    } else if (row === 1) {
      // Left - one eye on left
      gfx.fillRect(11, 7, 2, 2)
    } else if (row === 2) {
      // Right - one eye on right
      gfx.fillRect(19, 7, 2, 2)
    }
    // Up (row 3) - no eyes visible

    // Legs
    gfx.fillStyle(0x2244aa, 1)
    gfx.fillRect(10, 26, 5, 4)
    gfx.fillRect(17, 26, 5, 4)

    gfx.generateTexture(`player-${dir}`, TILE_SIZE, TILE_SIZE)
    gfx.destroy()
  }
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd!: {
    W: Phaser.Input.Keyboard.Key
    A: Phaser.Input.Keyboard.Key
    S: Phaser.Input.Keyboard.Key
    D: Phaser.Input.Keyboard.Key
  }
  public interactKey!: Phaser.Input.Keyboard.Key
  public movementEnabled = true
  private currentDir = 'down'
  private bobTween: Phaser.Tweens.Tween | null = null
  private baseY: number

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player-down')
    this.baseY = y
    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.setSize(20, 20)
    this.setOffset(6, 10)

    const body = this.body as Phaser.Physics.Arcade.Body
    body.setCollideWorldBounds(true)

    // Input
    this.cursors = scene.input.keyboard!.createCursorKeys()
    this.wasd = {
      W: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    }
    this.interactKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E)
  }

  update(): void {
    if (!this.movementEnabled) {
      this.setVelocity(0, 0)
      return
    }

    let vx = 0
    let vy = 0

    const left = this.cursors.left.isDown || this.wasd.A.isDown
    const right = this.cursors.right.isDown || this.wasd.D.isDown
    const up = this.cursors.up.isDown || this.wasd.W.isDown
    const down = this.cursors.down.isDown || this.wasd.S.isDown

    if (left) vx -= 1
    if (right) vx += 1
    if (up) vy -= 1
    if (down) vy += 1

    // Normalize diagonal
    if (vx !== 0 && vy !== 0) {
      const diag = Math.SQRT1_2
      vx *= diag
      vy *= diag
    }

    const body = this.body as Phaser.Physics.Arcade.Body
    body.setVelocity(vx * PLAYER_SPEED, vy * PLAYER_SPEED)

    // Direction texture swap
    let newDir = this.currentDir
    if (vx !== 0 || vy !== 0) {
      if (Math.abs(vy) >= Math.abs(vx)) {
        newDir = vy < 0 ? 'up' : 'down'
      } else {
        newDir = vx < 0 ? 'left' : 'right'
      }
    }

    if (newDir !== this.currentDir) {
      this.currentDir = newDir
      this.setTexture(`player-${newDir}`)
    }
  }
}
