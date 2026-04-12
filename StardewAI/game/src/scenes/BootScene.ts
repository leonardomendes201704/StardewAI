import Phaser from 'phaser'
import { generateTilesetTexture } from '../systems/WorldBuilder'
import { generatePlayerTexture } from '../entities/Player'
import { generateNPCTexture } from '../entities/AgentNPC'
import { generateStatusTextures } from '../ui/StatusBubble'
import { AGENTS } from '../data/agents'
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from '../config'

function generateDeskTexture(scene: Phaser.Scene): void {
  const gfx = scene.add.graphics()
  const S = TILE_SIZE

  // Table legs
  gfx.fillStyle(0x6b4c2a, 1)
  gfx.fillRect(4, 24, 3, 8)
  gfx.fillRect(S - 7, 24, 3, 8)

  // Table top (brown wood)
  gfx.fillStyle(0x8b6834, 1)
  gfx.fillRect(2, 18, S - 4, 8)
  // Wood grain
  gfx.fillStyle(0x7a5c2e, 1)
  gfx.fillRect(4, 20, S - 8, 1)
  gfx.fillRect(6, 23, S - 12, 1)

  // Notebook base (dark)
  gfx.fillStyle(0x333344, 1)
  gfx.fillRect(8, 12, 16, 10)
  // Screen (bright blue-white)
  gfx.fillStyle(0x88bbff, 1)
  gfx.fillRect(9, 13, 14, 7)
  // Screen glow effect
  gfx.fillStyle(0xaaddff, 1)
  gfx.fillRect(10, 14, 12, 5)
  // Screen content lines
  gfx.fillStyle(0x66aaee, 1)
  gfx.fillRect(11, 15, 8, 1)
  gfx.fillRect(11, 17, 10, 1)
  // Keyboard area
  gfx.fillStyle(0x444455, 1)
  gfx.fillRect(9, 20, 14, 3)
  gfx.fillStyle(0x555566, 1)
  gfx.fillRect(10, 21, 4, 1)
  gfx.fillRect(15, 21, 4, 1)
  gfx.fillRect(20, 21, 2, 1)

  gfx.generateTexture('desk', S, S)
  gfx.destroy()
}

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  create(): void {
    // Loading text
    const loadText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, 'Carregando...', {
      fontFamily: '"Press Start 2P"',
      fontSize: '14px',
      color: '#88aaff',
    })
    loadText.setOrigin(0.5, 0.5)

    const statusText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, '', {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      color: '#888888',
    })
    statusText.setOrigin(0.5, 0.5)

    // Generate all placeholder textures
    statusText.setText('Gerando terreno...')
    generateTilesetTexture(this)

    statusText.setText('Gerando jogador...')
    generatePlayerTexture(this)

    statusText.setText('Gerando agentes...')
    for (const agent of AGENTS) {
      generateNPCTexture(this, agent.id, agent.color)
    }

    statusText.setText('Gerando mobilia...')
    generateDeskTexture(this)

    statusText.setText('Gerando icones...')
    generateStatusTextures(this)

    // Transition to game scenes
    window.setTimeout(() => {
      this.scene.stop('BootScene')
      this.scene.start('MainScene')
      this.scene.start('UIScene')
    }, 500)
  }
}
