import { MAP_BOUNDS, GRID_SIZE, MINIMAP_PADDING } from "@/lib/constants"
import type { Position } from "@/types"

export function worldToGrid(position: Position): { row: number; col: number } {
  const normalizedX = (position.x - MAP_BOUNDS.minX) / (MAP_BOUNDS.maxX - MAP_BOUNDS.minX)
  const normalizedZ = 1 - (position.z - MAP_BOUNDS.minZ) / (MAP_BOUNDS.maxZ - MAP_BOUNDS.minZ)

  const col = Math.floor(normalizedX * GRID_SIZE)
  const row = Math.floor(normalizedZ * GRID_SIZE)

  return {
    row: Math.max(0, Math.min(GRID_SIZE - 1, row)),
    col: Math.max(0, Math.min(GRID_SIZE - 1, col)),
  }
}

export function gridToWorld(row: number, col: number): Position {
  const cellWidth = (MAP_BOUNDS.maxX - MAP_BOUNDS.minX) / GRID_SIZE
  const cellHeight = (MAP_BOUNDS.maxZ - MAP_BOUNDS.minZ) / GRID_SIZE

  const invertedRow = GRID_SIZE - 1 - row

  return {
    x: MAP_BOUNDS.minX + col * cellWidth + cellWidth / 2,
    z: MAP_BOUNDS.minZ + invertedRow * cellHeight + cellHeight / 2,
  }
}

export function normalizePosition(position: Position): { x: number; y: number } {
  const rawX = (position.x - MAP_BOUNDS.minX) / (MAP_BOUNDS.maxX - MAP_BOUNDS.minX)
  const rawY = 1 - (position.z - MAP_BOUNDS.minZ) / (MAP_BOUNDS.maxZ - MAP_BOUNDS.minZ)

  const playableWidth = 1 - MINIMAP_PADDING.left - MINIMAP_PADDING.right
  const playableHeight = 1 - MINIMAP_PADDING.top - MINIMAP_PADDING.bottom

  return {
    x: MINIMAP_PADDING.left + rawX * playableWidth,
    y: MINIMAP_PADDING.top + rawY * playableHeight,
  }
}

export function worldToNormalized(position: Position): { x: number; y: number } {
  return normalizePosition(position)
}
