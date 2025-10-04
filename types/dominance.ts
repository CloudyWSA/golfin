export interface GridCell {
  row: number
  col: number
  dominance: "blue" | "red" | "neutral"
  strength: number
}

export interface DominanceMap {
  timestamp: number
  grid: GridCell[][]
}

export interface MapBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}
