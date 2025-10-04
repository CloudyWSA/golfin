import { worldToNormalized } from "@/lib/utils/coordinates"
import type { TimelineFrame, DominanceMap, Participant, Ward } from "@/types"

export interface DominanceStrategy {
  calculate(frame: TimelineFrame): DominanceMap
}

export class ProximityDominanceStrategy implements DominanceStrategy {
  private championVisionRange = 1400
  private wardVisionRange = 900
  private resolution = 100

  calculate(frame: TimelineFrame): DominanceMap {
    const influenceMap: Array<{ x: number; y: number; blue: number; red: number }> = []

    if (!frame.snapshot) {
      return { timestamp: frame.timestamp, grid: [], influenceMap: [] }
    }

    const champions = frame.snapshot.participants.filter((p) => p.position)
    const wards = frame.wards || []

    for (let i = 0; i < this.resolution; i++) {
      for (let j = 0; j < this.resolution; j++) {
        const x = i / (this.resolution - 1)
        const y = j / (this.resolution - 1)

        const baseBlue = this.calculateBaseTerritory(x, y, 100)
        const baseRed = this.calculateBaseTerritory(x, y, 200)

        const { blue: dynamicBlue, red: dynamicRed } = this.calculateInfluenceAt(x, y, champions, wards)

        const totalBlue = baseBlue + dynamicBlue * 2
        const totalRed = baseRed + dynamicRed * 2

        influenceMap.push({ x, y, blue: totalBlue, red: totalRed })
      }
    }

    return {
      timestamp: frame.timestamp,
      grid: [],
      influenceMap,
    }
  }

  private calculateBaseTerritory(x: number, y: number, teamId: number): number {
    const distanceFromDiagonal = teamId === 100 ? y - x : x - y

    const baseInfluence = Math.max(0, Math.min(1, distanceFromDiagonal * 2 + 0.5))
    return baseInfluence * 0.3
  }

  private calculateInfluenceAt(
    x: number,
    y: number,
    champions: Participant[],
    wards: Ward[],
  ): { blue: number; red: number } {
    let blueInfluence = 0
    let redInfluence = 0

    for (const champion of champions) {
      if (!champion.position) continue

      const champPos = worldToNormalized(champion.position)
      const distance = this.calculateDistance(x, y, champPos.x, champPos.y)
      const influence = this.calculateAuraStrength(distance, this.championVisionRange / 14820) * 1.5

      if (champion.teamId === 100) {
        blueInfluence += influence
      } else {
        redInfluence += influence
      }
    }

    for (const ward of wards) {
      if (!ward.position) continue

      const wardPos = worldToNormalized(ward.position)
      const distance = this.calculateDistance(x, y, wardPos.x, wardPos.y)
      const influence = this.calculateAuraStrength(distance, this.wardVisionRange / 14820) * 1.2

      if (ward.teamId === 100) {
        blueInfluence += influence * 0.8
      } else {
        redInfluence += influence * 0.8
      }
    }

    return { blue: blueInfluence, red: redInfluence }
  }

  private calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
  }

  private calculateAuraStrength(distance: number, range: number): number {
    if (distance > range) return 0

    const normalized = distance / range
    return Math.pow(1 - normalized, 2)
  }
}

export function createDominanceCalculator(strategy: "proximity" = "proximity"): DominanceStrategy {
  switch (strategy) {
    case "proximity":
      return new ProximityDominanceStrategy()
    default:
      return new ProximityDominanceStrategy()
  }
}
