// Map dominance calculation types
export interface GridCell {
  row: number
  col: number
  dominance: "blue" | "red" | "neutral"
  strength: number // 0-1, how strongly dominated
}

export interface DominanceMap {
  timestamp: number
  grid: GridCell[][] // 3x3 grid
}

export interface MapBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}
