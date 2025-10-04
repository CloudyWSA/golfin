// League of Legends map constants
type MapBounds = {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

export const MAP_BOUNDS: MapBounds = {
  minX: 0,
  maxX: 14820,
  minZ: 0,
  maxZ: 14881,
}

export const GRID_SIZE = 3

export const TEAM_COLORS = {
  blue: "#3b82f6",
  red: "#ef4444",
  neutral: "#6b7280",
} as const

export const ENTITY_ICONS = {
  champion: "👤",
  ward: "👁️",
  turret: "🗼",
  dragon: "🐉",
  baron: "👹",
} as const

export const MINIMAP_PADDING = {
  top: 0.03, // 3% padding at top
  right: 0.03, // 3% padding at right
  bottom: 0.03, // 3% padding at bottom
  left: 0.03, // 3% padding at left
} as const

export const CHUNK_SIZE = 1000 // Lines to process per chunk
export const CACHE_WINDOW_SIZE = 100 // Frames to keep in memory
