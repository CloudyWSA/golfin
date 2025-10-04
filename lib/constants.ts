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
  top: 0.03,
  right: 0.03,
  bottom: 0.03,
  left: 0.03,
} as const

export const CHUNK_SIZE = 1000
export const CACHE_WINDOW_SIZE = 100
