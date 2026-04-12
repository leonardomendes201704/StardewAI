import Phaser from 'phaser'
import { Player } from '../entities/Player'
import { AgentNPC } from '../entities/AgentNPC'
import { INTERACTION_DISTANCE } from '../config'

export class InteractionSystem {
  private scene: Phaser.Scene
  private player: Player
  private npcs: AgentNPC[]
  public nearestNPC: AgentNPC | null = null
  private interactCooldown = false

  constructor(scene: Phaser.Scene, player: Player, npcs: AgentNPC[]) {
    this.scene = scene
    this.player = player
    this.npcs = npcs

    this.player.interactKey.on('down', () => {
      if (this.nearestNPC && !this.interactCooldown) {
        this.interactCooldown = true
        this.scene.game.events.emit('npc-interact', this.nearestNPC)
        this.scene.time.delayedCall(300, () => {
          this.interactCooldown = false
        })
      }
    })
  }

  update(): void {
    let closest: AgentNPC | null = null
    let closestDist = INTERACTION_DISTANCE

    for (const npc of this.npcs) {
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        npc.x, npc.y
      )
      if (dist < closestDist) {
        closestDist = dist
        closest = npc
      }
    }

    if (closest !== this.nearestNPC) {
      // Player left previous NPC
      if (this.nearestNPC) {
        this.nearestNPC.onPlayerLeft()
      }
      this.nearestNPC = closest
      if (closest) {
        // Player approached new NPC
        closest.onPlayerNear()
        this.scene.game.events.emit('show-interact-prompt', closest)
      } else {
        this.scene.game.events.emit('hide-interact-prompt')
      }
    }
  }
}
