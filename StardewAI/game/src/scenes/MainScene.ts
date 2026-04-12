import Phaser from 'phaser'
import { buildWorld } from '../systems/WorldBuilder'
import { Player } from '../entities/Player'
import { AgentNPC } from '../entities/AgentNPC'
import { InteractionSystem } from '../systems/InteractionSystem'
import { AGENTS } from '../data/agents'
import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from '../config'
import { AgentStatus } from '../types'

export class MainScene extends Phaser.Scene {
  private player!: Player
  private npcs: AgentNPC[] = []
  private interactionSystem!: InteractionSystem

  constructor() {
    super({ key: 'MainScene' })
  }

  create(): void {
    // Build the tile world
    const { collisionLayer } = buildWorld(this)

    // Set world bounds
    const worldW = MAP_WIDTH * TILE_SIZE
    const worldH = MAP_HEIGHT * TILE_SIZE
    this.physics.world.setBounds(0, 0, worldW, worldH)

    // Create player at center of map
    const spawnX = 19 * TILE_SIZE + TILE_SIZE / 2
    const spawnY = 14 * TILE_SIZE + TILE_SIZE / 2
    this.player = new Player(this, spawnX, spawnY)

    // Player collides with walls/trees/water
    this.physics.add.collider(this.player, collisionLayer)

    // Create desks inside each room
    for (const agentDef of AGENTS) {
      const deskX = agentDef.deskTileX * TILE_SIZE + TILE_SIZE / 2
      const deskY = agentDef.deskTileY * TILE_SIZE + TILE_SIZE / 2
      this.add.image(deskX, deskY, 'desk').setDepth(0)
    }

    // Create NPCs
    for (const agentDef of AGENTS) {
      const npc = new AgentNPC(this, agentDef)
      this.npcs.push(npc)
      this.physics.add.collider(this.player, npc)
    }

    // Listen for agent-visit-walk: NPC walks to another NPC
    this.game.events.on('agent-walk-to-agent', (visitorId: string, targetId: string, onArrive: () => void) => {
      const visitor = this.npcs.find(n => n.agentDef.id === visitorId)
      const target = this.npcs.find(n => n.agentDef.id === targetId)
      if (visitor && target) {
        visitor.walkToAgent(target, onArrive)
      }
    })

    // Camera follows player
    this.cameras.main.setBounds(0, 0, worldW, worldH)
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08)
    this.cameras.main.setZoom(1)

    // Interaction system
    this.interactionSystem = new InteractionSystem(this, this.player, this.npcs)

    // Listen for task status changes from UIScene
    this.game.events.on('task-status-changed', (agentId: string, status: AgentStatus) => {
      const npc = this.npcs.find(n => n.agentDef.id === agentId)
      if (npc) {
        npc.setAgentStatus(status)
      }
    })

    // Listen for dialog open/close to disable/enable player movement
    this.game.events.on('dialog-opened', () => {
      this.player.movementEnabled = false
    })
    this.game.events.on('dialog-closed', () => {
      this.player.movementEnabled = true
    })
  }

  update(): void {
    this.player.update()
    this.interactionSystem.update()
  }
}
