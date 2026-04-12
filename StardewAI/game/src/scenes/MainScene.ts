import Phaser from 'phaser'
import { buildWorld } from '../systems/WorldBuilder'
import { Player } from '../entities/Player'
import { AgentNPC } from '../entities/AgentNPC'
import { InteractionSystem } from '../systems/InteractionSystem'
import { AGENTS } from '../data/agents'
import { MAP_DATA } from '../data/world-layout'
import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from '../config'
import { AgentStatus } from '../types'

// Door tile index in MAP_DATA
const DOOR_TILE = 6
const DOOR_PROXIMITY = 48 // pixels

export class MainScene extends Phaser.Scene {
  private player!: Player
  private npcs: AgentNPC[] = []
  private interactionSystem!: InteractionSystem
  private doorSprites: Map<string, Phaser.GameObjects.Image> = new Map()
  private doorOpen: Set<string> = new Set()

  constructor() {
    super({ key: 'MainScene' })
  }

  create(): void {
    const { collisionLayer } = buildWorld(this)

    const worldW = MAP_WIDTH * TILE_SIZE
    const worldH = MAP_HEIGHT * TILE_SIZE
    this.physics.world.setBounds(0, 0, worldW, worldH)

    const spawnX = 19 * TILE_SIZE + TILE_SIZE / 2
    const spawnY = 14 * TILE_SIZE + TILE_SIZE / 2
    this.player = new Player(this, spawnX, spawnY)

    this.physics.add.collider(this.player, collisionLayer)

    // Create desks
    for (const agentDef of AGENTS) {
      const deskX = agentDef.deskTileX * TILE_SIZE + TILE_SIZE / 2
      const deskY = agentDef.deskTileY * TILE_SIZE + TILE_SIZE / 2
      this.add.image(deskX, deskY, 'desk').setDepth(0)
    }

    // Create door sprites at all door positions in the map
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (MAP_DATA[y][x] === DOOR_TILE) {
          const px = x * TILE_SIZE + TILE_SIZE / 2
          const py = y * TILE_SIZE + TILE_SIZE / 2
          const key = `${x},${y}`
          const doorSprite = this.add.image(px, py, 'door-closed').setDepth(1)
          this.doorSprites.set(key, doorSprite)
        }
      }
    }

    // Create campfire
    const campfireX = 19 * TILE_SIZE + TILE_SIZE / 2
    const campfireY = 15 * TILE_SIZE + TILE_SIZE / 2
    const campfire = this.add.image(campfireX, campfireY, 'campfire').setDepth(0)
    this.tweens.add({
      targets: campfire,
      scaleX: 1.1,
      scaleY: 1.15,
      duration: 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    // Create NPCs
    for (const agentDef of AGENTS) {
      const npc = new AgentNPC(this, agentDef)
      this.npcs.push(npc)
      this.physics.add.collider(this.player, npc)
    }

    // NPC stepping on a tile → check if door
    this.game.events.on('npc-on-tile', (tileX: number, tileY: number) => {
      this.openDoorAt(tileX, tileY)
    })

    // Agent visit walk event
    this.game.events.on('agent-walk-to-agent', (visitorId: string, targetId: string, onArrive: () => void) => {
      const visitor = this.npcs.find(n => n.agentDef.id === visitorId)
      const target = this.npcs.find(n => n.agentDef.id === targetId)
      if (visitor && target) {
        visitor.walkToAgent(target, onArrive)
      }
    })

    // Camera
    this.cameras.main.setBounds(0, 0, worldW, worldH)
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08)

    // Interaction system
    this.interactionSystem = new InteractionSystem(this, this.player, this.npcs)

    // Task status
    this.game.events.on('task-status-changed', (agentId: string, status: AgentStatus) => {
      const npc = this.npcs.find(n => n.agentDef.id === agentId)
      if (npc) npc.setAgentStatus(status)
    })

    // Dialog movement lock
    this.game.events.on('dialog-opened', () => { this.player.movementEnabled = false })
    this.game.events.on('dialog-closed', () => { this.player.movementEnabled = true })
  }

  update(): void {
    this.player.update()
    this.interactionSystem.update()
    this.checkPlayerNearDoors()
  }

  /** Check if player is near any door and open/close accordingly */
  private checkPlayerNearDoors(): void {
    for (const [key, sprite] of this.doorSprites) {
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        sprite.x, sprite.y
      )

      if (dist < DOOR_PROXIMITY && !this.doorOpen.has(key)) {
        this.openDoor(key, sprite)
      } else if (dist >= DOOR_PROXIMITY && this.doorOpen.has(key)) {
        // Only close if no NPC is near either
        let npcNear = false
        for (const npc of this.npcs) {
          const npcDist = Phaser.Math.Distance.Between(npc.x, npc.y, sprite.x, sprite.y)
          if (npcDist < DOOR_PROXIMITY) { npcNear = true; break }
        }
        if (!npcNear) {
          this.closeDoor(key, sprite)
        }
      }
    }
  }

  /** Open door triggered by NPC stepping on tile */
  private openDoorAt(tileX: number, tileY: number): void {
    const key = `${tileX},${tileY}`
    const sprite = this.doorSprites.get(key)
    if (sprite && !this.doorOpen.has(key)) {
      this.openDoor(key, sprite)
      // Auto-close after 2 seconds
      this.time.delayedCall(2000, () => {
        // Only close if no one is near
        let anyoneNear = false
        const allEntities = [this.player, ...this.npcs]
        for (const e of allEntities) {
          const d = Phaser.Math.Distance.Between(e.x, e.y, sprite.x, sprite.y)
          if (d < DOOR_PROXIMITY) { anyoneNear = true; break }
        }
        if (!anyoneNear) this.closeDoor(key, sprite)
      })
    }
  }

  private openDoor(key: string, sprite: Phaser.GameObjects.Image): void {
    this.doorOpen.add(key)
    sprite.setTexture('door-open')
    this.tweens.add({
      targets: sprite,
      scaleX: 1.1,
      duration: 150,
      yoyo: true,
      ease: 'Back.easeOut',
    })
  }

  private closeDoor(key: string, sprite: Phaser.GameObjects.Image): void {
    this.doorOpen.delete(key)
    sprite.setTexture('door-closed')
  }
}
