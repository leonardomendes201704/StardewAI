import { MAP_DATA } from '../data/world-layout'
import { MAP_WIDTH, MAP_HEIGHT } from '../config'

// Tile movement costs (lower = preferred)
const TILE_COSTS: Record<number, number> = {
  0: 2,   // GRASS - walkable
  1: 1,   // DIRT_PATH - preferred!
  2: -1,  // WATER - blocked
  3: 2,   // FLOWERS - walkable
  4: -1,  // TREE - blocked
  5: -1,  // BUILDING - blocked
  6: 1,   // DOOR - walkable (NPCs use doors)
}

// Occupied tiles registry — NPCs register where they are
const occupiedTiles = new Map<string, string>() // key "x,y" → npcId

export function registerOccupied(tileX: number, tileY: number, npcId: string): void {
  occupiedTiles.set(`${tileX},${tileY}`, npcId)
}

export function unregisterOccupied(tileX: number, tileY: number, npcId: string): void {
  const key = `${tileX},${tileY}`
  if (occupiedTiles.get(key) === npcId) {
    occupiedTiles.delete(key)
  }
}

export function isTileOccupied(tileX: number, tileY: number, excludeNpcId?: string): boolean {
  const key = `${tileX},${tileY}`
  const occupant = occupiedTiles.get(key)
  if (!occupant) return false
  if (excludeNpcId && occupant === excludeNpcId) return false
  return true
}

interface Node {
  x: number
  y: number
  g: number
  h: number
  f: number
  parent: Node | null
}

function heuristic(ax: number, ay: number, bx: number, by: number): number {
  return (Math.abs(ax - bx) + Math.abs(ay - by))
}

function isWalkable(x: number, y: number): boolean {
  if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return false
  const tile = MAP_DATA[y][x]
  return TILE_COSTS[tile] > 0
}

function getCost(x: number, y: number, excludeNpcId?: string): number {
  const tile = MAP_DATA[y][x]
  let cost = TILE_COSTS[tile] || 999

  // Tiles occupied by other NPCs have very high cost (avoidance)
  if (isTileOccupied(x, y, excludeNpcId)) {
    cost += 50
  }

  return cost
}

const DIRS = [
  { x: 0, y: -1 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 1, y: 0 },
]

export function findPath(
  fromX: number, fromY: number,
  toX: number, toY: number,
  excludeNpcId?: string
): { x: number; y: number }[] {
  if (!isWalkable(toX, toY)) {
    const alt = findNearestWalkable(toX, toY, excludeNpcId)
    if (!alt) return []
    toX = alt.x
    toY = alt.y
  }

  // If destination is occupied by another NPC, find adjacent free tile
  if (isTileOccupied(toX, toY, excludeNpcId)) {
    const alt = findNearestFree(toX, toY, excludeNpcId)
    if (alt) { toX = alt.x; toY = alt.y }
  }

  if (!isWalkable(fromX, fromY)) {
    const alt = findNearestWalkable(fromX, fromY, excludeNpcId)
    if (!alt) return []
    fromX = alt.x
    fromY = alt.y
  }

  if (fromX === toX && fromY === toY) return []

  const openSet: Node[] = []
  const closedSet = new Set<string>()
  const key = (x: number, y: number) => `${x},${y}`

  const startNode: Node = {
    x: fromX, y: fromY,
    g: 0,
    h: heuristic(fromX, fromY, toX, toY),
    f: heuristic(fromX, fromY, toX, toY),
    parent: null,
  }
  openSet.push(startNode)

  const gScores = new Map<string, number>()
  gScores.set(key(fromX, fromY), 0)

  let iterations = 0
  const maxIterations = 2000

  while (openSet.length > 0 && iterations < maxIterations) {
    iterations++

    let lowestIdx = 0
    for (let i = 1; i < openSet.length; i++) {
      if (openSet[i].f < openSet[lowestIdx].f) lowestIdx = i
    }
    const current = openSet[lowestIdx]

    if (current.x === toX && current.y === toY) {
      return reconstructPath(current)
    }

    openSet.splice(lowestIdx, 1)
    closedSet.add(key(current.x, current.y))

    for (const dir of DIRS) {
      const nx = current.x + dir.x
      const ny = current.y + dir.y

      if (!isWalkable(nx, ny)) continue
      if (closedSet.has(key(nx, ny))) continue

      const tentativeG = current.g + getCost(nx, ny, excludeNpcId)
      const existingG = gScores.get(key(nx, ny))

      if (existingG !== undefined && tentativeG >= existingG) continue

      gScores.set(key(nx, ny), tentativeG)

      const neighbor: Node = {
        x: nx, y: ny,
        g: tentativeG,
        h: heuristic(nx, ny, toX, toY),
        f: tentativeG + heuristic(nx, ny, toX, toY),
        parent: current,
      }

      const existingIdx = openSet.findIndex(n => n.x === nx && n.y === ny)
      if (existingIdx >= 0) openSet.splice(existingIdx, 1)

      openSet.push(neighbor)
    }
  }

  return []
}

function reconstructPath(node: Node): { x: number; y: number }[] {
  const path: { x: number; y: number }[] = []
  let current: Node | null = node
  while (current) {
    path.unshift({ x: current.x, y: current.y })
    current = current.parent
  }
  if (path.length > 0) path.shift()
  return path
}

function findNearestWalkable(x: number, y: number, _excludeNpcId?: string): { x: number; y: number } | null {
  for (let r = 1; r <= 5; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        if (Math.abs(dx) + Math.abs(dy) !== r) continue
        const nx = x + dx
        const ny = y + dy
        if (isWalkable(nx, ny)) return { x: nx, y: ny }
      }
    }
  }
  return null
}

function findNearestFree(x: number, y: number, excludeNpcId?: string): { x: number; y: number } | null {
  for (const dir of DIRS) {
    const nx = x + dir.x
    const ny = y + dir.y
    if (isWalkable(nx, ny) && !isTileOccupied(nx, ny, excludeNpcId)) {
      return { x: nx, y: ny }
    }
  }
  return null
}

export function pixelToTile(px: number, py: number, tileSize: number): { x: number; y: number } {
  return {
    x: Math.floor(px / tileSize),
    y: Math.floor(py / tileSize),
  }
}

export function tileToPixel(tx: number, ty: number, tileSize: number): { x: number; y: number } {
  return {
    x: tx * tileSize + tileSize / 2,
    y: ty * tileSize + tileSize / 2,
  }
}
