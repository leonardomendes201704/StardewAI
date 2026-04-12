// Tile types: 0=GRASS, 1=DIRT_PATH, 2=WATER, 3=FLOWERS, 4=TREE, 5=BUILDING, 6=DOOR
// Map is 40 wide x 30 tall

const G = 0 // Grass
const D = 1 // Dirt path
const W = 2 // Water
const F = 3 // Flowers
const T = 4 // Tree
const B = 5 // Building wall
const R = 6 // Door/entrance

export const MAP_DATA: number[][] = [
  // Row 0 - top border
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  // Row 1
  [T,G,G,G,G,G,G,G,G,G,G,G,G,T,G,G,G,G,G,G,G,G,G,G,G,G,T,G,G,G,G,G,G,G,G,G,G,G,G,T],
  // Row 2
  [T,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,T],
  // Row 3 - Coder station (NW)
  [T,G,G,G,B,B,B,B,B,B,B,G,G,G,G,G,G,G,G,D,G,G,G,G,G,G,G,G,G,B,B,B,B,B,B,B,G,G,G,T],
  // Row 4
  [T,G,G,G,B,G,G,G,G,G,B,G,G,G,G,G,G,G,G,D,G,G,G,G,G,G,G,G,G,B,G,G,G,G,G,B,G,G,G,T],
  // Row 5
  [T,G,G,G,B,G,G,G,G,G,B,G,G,G,G,G,G,G,G,D,G,G,G,G,G,G,G,G,G,B,G,G,G,G,G,B,G,G,G,T],
  // Row 6 - Agent positions (y=6)
  [T,G,G,G,B,G,G,G,G,G,B,G,G,G,G,G,G,G,G,D,G,G,G,G,G,G,G,G,G,B,G,G,G,G,G,B,G,G,G,T],
  // Row 7
  [T,G,G,G,B,B,B,R,B,B,B,G,G,G,G,G,G,G,G,D,G,G,G,G,G,G,G,G,G,B,B,B,R,B,B,B,G,G,G,T],
  // Row 8
  [T,G,G,G,G,G,G,D,G,G,G,G,G,F,G,G,G,G,G,D,G,G,G,G,G,G,F,G,G,G,G,G,D,G,G,G,G,G,G,T],
  // Row 9
  [T,G,G,G,G,G,G,D,G,G,G,G,G,G,G,G,G,G,G,D,G,G,G,G,G,G,G,G,G,G,G,G,D,G,G,G,G,G,G,T],
  // Row 10
  [T,G,G,G,G,G,G,D,G,G,G,G,G,G,G,G,G,G,G,D,G,G,G,G,G,G,G,G,G,G,G,G,D,G,G,G,G,G,G,T],
  // Row 11
  [T,G,G,G,G,G,G,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,G,G,G,G,G,G,T],
  // Row 12
  [T,G,G,G,G,G,G,G,G,G,G,G,G,F,G,G,G,G,G,D,G,G,G,F,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,T],
  // Row 13
  [T,G,G,T,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,D,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,T,G,G,T],
  // Row 14 - Center of map (player spawn area)
  [T,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,D,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,T],
  // Row 15
  [T,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,D,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,T],
  // Row 16
  [T,G,G,G,G,G,G,G,G,G,G,G,G,G,F,G,G,G,G,D,G,G,G,G,F,G,G,G,G,G,G,G,G,G,G,G,G,G,G,T],
  // Row 17
  [T,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,D,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,T],
  // Row 18
  [T,G,G,G,G,G,G,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,G,G,G,G,G,G,T],
  // Row 19
  [T,G,G,G,G,G,G,D,G,G,G,G,G,G,G,G,G,G,G,D,G,G,G,G,G,G,G,G,G,G,G,G,D,G,G,G,G,G,G,T],
  // Row 20
  [T,G,G,G,G,G,G,D,G,G,G,G,F,G,G,G,G,G,G,D,G,G,G,G,G,G,F,G,G,G,G,G,D,G,G,G,G,G,G,T],
  // Row 21 - Tester & Designer stations (south)
  [T,G,G,G,B,B,B,R,B,B,B,G,G,G,G,G,G,G,G,D,G,G,G,G,G,G,G,G,G,B,B,B,R,B,B,B,G,G,G,T],
  // Row 22
  [T,G,G,G,B,G,G,G,G,G,B,G,G,G,G,G,G,G,G,D,G,G,G,G,G,G,G,G,G,B,G,G,G,G,G,B,G,G,G,T],
  // Row 23
  [T,G,G,G,B,G,G,G,G,G,B,G,G,G,G,G,G,G,G,D,G,G,G,G,G,G,G,G,G,B,G,G,G,G,G,B,G,G,G,T],
  // Row 24
  [T,G,G,G,B,G,G,G,G,G,B,G,G,G,G,G,G,G,G,D,G,G,G,G,G,G,G,G,G,B,G,G,G,G,G,B,G,G,G,T],
  // Row 25
  [T,G,G,G,B,B,B,B,B,B,B,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,B,B,B,B,B,B,B,G,G,G,T],
  // Row 26
  [T,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,W,W,W,W,W,W,W,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,T],
  // Row 27
  [T,G,G,F,G,G,G,G,G,G,G,G,G,G,G,W,W,W,W,W,W,W,W,W,G,G,G,G,G,G,G,G,G,G,G,F,G,G,G,T],
  // Row 28
  [T,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,W,W,W,W,W,W,W,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,T],
  // Row 29 - bottom border
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
]
