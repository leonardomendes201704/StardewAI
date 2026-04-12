import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { MainScene } from './scenes/MainScene'
import { UIScene } from './scenes/UIScene'
import { GAME_WIDTH, GAME_HEIGHT } from './config'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  pixelArt: true,
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  dom: {
    createContainer: true,
  },
  scene: [BootScene, MainScene, UIScene],
}

const game = new Phaser.Game(config)
// Expose for debugging
;(window as any).__GAME__ = game
