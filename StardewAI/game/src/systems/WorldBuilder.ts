import Phaser from 'phaser'
import { MAP_DATA } from '../data/world-layout'
import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from '../config'

// Tile indices matching the placeholder tileset spritesheet
const TILE_COLORS: Record<number, { color: number; label: string }> = {
  0: { color: 0x4a8c3f, label: 'grass' },      // Green grass
  1: { color: 0xc4a46c, label: 'dirt' },         // Dirt path
  2: { color: 0x3366aa, label: 'water' },         // Water
  3: { color: 0x4a8c3f, label: 'flowers' },       // Flowers (grass base)
  4: { color: 0x2d5a1e, label: 'tree' },          // Tree (dark green)
  5: { color: 0x8888aa, label: 'building' },      // Building wall
  6: { color: 0x6b4c2a, label: 'door' },          // Door
}

export function generateTilesetTexture(scene: Phaser.Scene): void {
  const totalTiles = Object.keys(TILE_COLORS).length
  const gfx = scene.add.graphics()

  for (let i = 0; i < totalTiles; i++) {
    const tile = TILE_COLORS[i]
    const x = i * TILE_SIZE
    const y = 0

    // Base tile
    gfx.fillStyle(tile.color, 1)
    gfx.fillRect(x, y, TILE_SIZE, TILE_SIZE)

    // Add details per tile type
    if (i === 0) {
      // Grass - subtle texture dots
      gfx.fillStyle(0x5a9c4f, 1)
      gfx.fillRect(x + 4, y + 8, 2, 2)
      gfx.fillRect(x + 18, y + 20, 2, 2)
      gfx.fillRect(x + 26, y + 6, 2, 2)
    } else if (i === 1) {
      // Dirt - some pebbles
      gfx.fillStyle(0xb09060, 1)
      gfx.fillRect(x + 6, y + 12, 3, 2)
      gfx.fillRect(x + 22, y + 8, 2, 2)
    } else if (i === 2) {
      // Water - wave lines
      gfx.fillStyle(0x4477bb, 1)
      gfx.fillRect(x + 4, y + 10, 8, 2)
      gfx.fillRect(x + 18, y + 18, 8, 2)
    } else if (i === 3) {
      // Flowers on grass
      gfx.fillStyle(0x5a9c4f, 1)
      gfx.fillRect(x + 4, y + 8, 2, 2)
      // Red flower
      gfx.fillStyle(0xff6666, 1)
      gfx.fillRect(x + 12, y + 12, 4, 4)
      gfx.fillStyle(0xffff66, 1)
      gfx.fillRect(x + 13, y + 13, 2, 2)
      // White flower
      gfx.fillStyle(0xffffff, 1)
      gfx.fillRect(x + 22, y + 6, 4, 4)
      gfx.fillStyle(0xffff88, 1)
      gfx.fillRect(x + 23, y + 7, 2, 2)
    } else if (i === 4) {
      // Tree - trunk and canopy
      gfx.fillStyle(0x6b4c2a, 1)
      gfx.fillRect(x + 12, y + 18, 8, 14)
      gfx.fillStyle(0x2d7a1e, 1)
      gfx.fillCircle(x + 16, y + 12, 12)
      gfx.fillStyle(0x3d8a2e, 1)
      gfx.fillCircle(x + 16, y + 10, 8)
    } else if (i === 5) {
      // Building wall - brick pattern
      gfx.fillStyle(0x7777aa, 1)
      gfx.fillRect(x + 0, y + 0, 14, 14)
      gfx.fillRect(x + 16, y + 0, 16, 14)
      gfx.fillRect(x + 8, y + 16, 14, 16)
      gfx.fillStyle(0x9999bb, 1)
      gfx.fillRect(x + 2, y + 2, 10, 10)
      gfx.fillRect(x + 18, y + 2, 12, 10)
      gfx.fillRect(x + 10, y + 18, 10, 12)
    } else if (i === 6) {
      // Door
      gfx.fillStyle(0x8b6834, 1)
      gfx.fillRect(x + 4, y + 2, 24, 28)
      gfx.fillStyle(0xa07840, 1)
      gfx.fillRect(x + 6, y + 4, 20, 24)
      // Handle
      gfx.fillStyle(0xffcc00, 1)
      gfx.fillRect(x + 22, y + 14, 3, 3)
    }
  }

  gfx.generateTexture('tileset', totalTiles * TILE_SIZE, TILE_SIZE)
  gfx.destroy()
}

export function buildWorld(scene: Phaser.Scene): {
  map: Phaser.Tilemaps.Tilemap
  groundLayer: Phaser.Tilemaps.TilemapLayer
  collisionLayer: Phaser.Tilemaps.TilemapLayer
} {
  const mapData = new Phaser.Tilemaps.MapData({
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    tileWidth: TILE_SIZE,
    tileHeight: TILE_SIZE,
  })

  const map = new Phaser.Tilemaps.Tilemap(scene, mapData)
  const tileset = map.addTilesetImage('tileset', 'tileset', TILE_SIZE, TILE_SIZE, 0, 0)!

  // Ground layer - all tiles
  const groundLayer = map.createBlankLayer('ground', tileset, 0, 0, MAP_WIDTH, MAP_HEIGHT)!

  // Collision layer - trees, water, buildings
  const collisionLayer = map.createBlankLayer('collision', tileset, 0, 0, MAP_WIDTH, MAP_HEIGHT)!

  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      const tileIndex = MAP_DATA[y][x]

      if (tileIndex === 4 || tileIndex === 2 || tileIndex === 5) {
        // Collidable tiles: put grass underneath, object on collision layer
        groundLayer.putTileAt(0, x, y) // grass underneath
        collisionLayer.putTileAt(tileIndex, x, y)
      } else {
        groundLayer.putTileAt(tileIndex, x, y)
      }
    }
  }

  collisionLayer.setCollisionByExclusion([-1])

  return { map, groundLayer, collisionLayer }
}
