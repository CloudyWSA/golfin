import type {
  TimelineFrame,
  GameEvent,
  StateSnapshot,
  GameMetadata,
  Participant,
  Ward,
  ChannelingEvent,
  KillEvent,
  ParticipantDetailed,
  ItemSlot,
} from "@/types"

export interface JSONLParserConfig {
  chunkSize?: number
  onProgress?: (progress: number) => void
  onFrame?: (frame: TimelineFrame) => void
}

export class JSONLParser {
  private config: Required<JSONLParserConfig>
  private metadata: GameMetadata | null = null
  private participants: Map<number, Participant> = new Map()
  private wardEvents: any[] = []
  private wardDestroyEvents: any[] = []
  private channelingEvents: any[] = []
  private killEvents: any[] = []

  private lastKnownSnapshot: StateSnapshot | null = null
  private participantStats: Map<number, { kills: number; deaths: number; assists: number }> = new Map()

  constructor(config: JSONLParserConfig = {}) {
    this.config = {
      chunkSize: config.chunkSize ?? 1000,
      onProgress: config.onProgress ?? (() => {}),
      onFrame: config.onFrame ?? (() => {}),
    }
  }

  async parseFile(file: File): Promise<{ metadata: GameMetadata; frames: TimelineFrame[] }> {
    const frames: TimelineFrame[] = []
    const text = await file.text()
    const lines = text.split("\n").filter((line) => line.trim())
    const totalLines = lines.length
    let processedLines = 0
    const frameMap = new Map<number, GameEvent[]>()
    let maxTimestamp = 0

    for (let i = 0; i < lines.length; i += this.config.chunkSize) {
      const chunk = lines.slice(i, i + this.config.chunkSize)

      for (const line of chunk) {
        try {
          const rawEvent = JSON.parse(line)
          const event: GameEvent = {
            gameTime: rawEvent.gameTime || 0,
            eventType: this.mapEventType(rawEvent),
            eventDetails: rawEvent,
          }

          if (event.gameTime > maxTimestamp) {
            maxTimestamp = event.gameTime
          }

          if (!this.metadata && rawEvent.rfc461Schema === "stats_update") {
            this.extractMetadata(rawEvent)
          }

          if (rawEvent.rfc461Schema === "ward_placed") this.wardEvents.push(rawEvent)
          if (rawEvent.rfc461Schema === "ward_killed") this.wardDestroyEvents.push(rawEvent)
          if (rawEvent.rfc461Schema === "channeling_started" || rawEvent.rfc461Schema === "channeling_ended")
            this.channelingEvents.push(rawEvent)
          if (rawEvent.rfc461Schema === "champion_kill") this.killEvents.push(rawEvent)

          const timestamp = Math.floor(event.gameTime / 1000)
          if (!frameMap.has(timestamp)) {
            frameMap.set(timestamp, [])
          }
          frameMap.get(timestamp)!.push(event)
        } catch (error) {
          // silent fail
        }
      }

      processedLines += chunk.length
      this.config.onProgress(processedLines / totalLines)
      await new Promise((resolve) => setTimeout(resolve, 0))
    }

    const endOfGameTimestamp = Math.floor(maxTimestamp / 1000)
    const wardLifecycle = this.calculateWardLifecycles()

    for (let timestamp = 0; timestamp <= endOfGameTimestamp; timestamp++) {
      const events = frameMap.get(timestamp) || []
      const frame = this.createFrame(timestamp, events, wardLifecycle)
      frames.push(frame)
      this.config.onFrame(frame)
    }

    if (this.metadata) {
      this.metadata.duration = endOfGameTimestamp
    }

    return {
      metadata: this.metadata!,
      frames,
    }
  }

  private calculateWardLifecycles(): Ward[] {
    const WARD_DURATIONS: Record<string, number> = {
      YELLOW_TRINKET: 120,
      SIGHT_WARD: 7,
      BLUE_TRINKET: Number.POSITIVE_INFINITY,
      CONTROL_WARD: Number.POSITIVE_INFINITY,
    }

    const sortedWardEvents = [...this.wardEvents].sort((a, b) => a.gameTime - b.gameTime)
    const sortedDestroyEvents = [...this.wardDestroyEvents].sort((a, b) => a.gameTime - b.gameTime)

    const wards: (Ward & { destroyed?: boolean })[] = sortedWardEvents.map((wardEvent) => {
      const placedAt = Math.floor(wardEvent.gameTime / 1000)
      const placer = this.participants.get(wardEvent.placer)
      const teamId = placer?.teamId || 200
      const wardType = this.normalizeWardType(wardEvent.wardType || "yellowTrinket")
      const duration = WARD_DURATIONS[wardType] || Number.POSITIVE_INFINITY
      const expiresAt = duration !== Number.POSITIVE_INFINITY ? placedAt + duration : Number.POSITIVE_INFINITY

      return {
        wardId: `ward-${wardEvent.gameTime}-${wardEvent.placer}`,
        teamId,
        position: { x: wardEvent.position.x, z: wardEvent.position.z },
        placedAt,
        expiresAt,
        wardType,
        destroyed: false,
      }
    })

    for (const destroyEvent of sortedDestroyEvents) {
      if (!destroyEvent.position) continue

      const destroyedAt = Math.floor(destroyEvent.gameTime / 1000)
      let closestWard: (Ward & { destroyed?: boolean }) | null = null
      let minDistanceSq = Number.POSITIVE_INFINITY

      const candidateWards = wards.filter((w) => !w.destroyed && w.placedAt <= destroyedAt && w.expiresAt > destroyedAt)

      for (const candidate of candidateWards) {
        if (!candidate.position) continue

        const dx = destroyEvent.position.x - candidate.position.x
        const dz = destroyEvent.position.z - candidate.position.z
        const distanceSq = dx * dx + dz * dz

        if (distanceSq < minDistanceSq) {
          minDistanceSq = distanceSq
          closestWard = candidate
        }
      }

      if (closestWard) {
        closestWard.expiresAt = destroyedAt
        closestWard.destroyed = true
      }
    }

    return wards
  }

  private getActiveWardsAt(timestamp: number, wardLifecycle: Ward[]): Ward[] {
    return wardLifecycle.filter((ward) => timestamp >= ward.placedAt && timestamp < ward.expiresAt)
  }

  private createFrame(timestamp: number, events: GameEvent[], wardLifecycle: Ward[]): TimelineFrame {
    events.forEach((event) => {
      if (event.eventType === "ChampionKill") {
        const details = event.eventDetails
        const killerId = details.killer
        const victimId = details.victim
        const assistIds = details.assistants || []
        if (killerId && this.participantStats.has(killerId)) this.participantStats.get(killerId)!.kills++
        if (victimId && this.participantStats.has(victimId)) this.participantStats.get(victimId)!.deaths++
        assistIds.forEach((id: number) => {
          if (this.participantStats.has(id)) this.participantStats.get(id)!.assists++
        })
      }
    })

    const snapshotEvent = events.find((e) => e.eventType === "StateSnapshot")
    if (snapshotEvent) {
      this.lastKnownSnapshot = this.parseSnapshot(snapshotEvent)
    }

    let currentSnapshotForFrame: StateSnapshot | undefined = undefined
    if (this.lastKnownSnapshot) {
      currentSnapshotForFrame = JSON.parse(JSON.stringify(this.lastKnownSnapshot))
      currentSnapshotForFrame.participants.forEach((p) => {
        const liveStats = this.participantStats.get(p.participantId)
        if (liveStats) {
          p.kills = liveStats.kills
          p.deaths = liveStats.deaths
          p.assists = liveStats.assists
        }
      })
    }

    return {
      timestamp,
      snapshot: currentSnapshotForFrame,
      events,
      wards: this.getActiveWardsAt(timestamp, wardLifecycle),
      activeChannelings: this.getActiveChannelingsAt(timestamp),
      recentKills: this.getRecentKillsAt(timestamp),
    }
  }

  private mapEventType(rawEvent: any): string {
    const schema = rawEvent.rfc461Schema
    if (schema === "stats_update") return "StateSnapshot"
    if (schema === "item_purchased") return "ItemPurchased"
    if (schema === "skill_level_up") return "SkillLevelUp"
    if (schema === "skill_used") return "SkillUsed"
    if (schema === "ward_placed") return "WardPlaced"
    if (schema === "ward_killed") return "WardKilled"
    if (schema === "champion_kill") return "ChampionKill"
    if (schema === "building_destroyed") return "TurretKilled"
    if (schema === "epic_monster_kill") return "EpicMonsterKill"
    if (schema === "summoner_spell_used") return "SummonerSpellUsed"
    if (schema === "channeling_started") return "ChannelingStarted"
    if (schema === "channeling_ended") return "ChannelingEnded"
    return schema || "Unknown"
  }

  private extractMetadata(rawEvent: any) {
    if (this.metadata) return
    if (rawEvent.participants) {
      const participants = rawEvent.participants as any[]
      participants.forEach((p) => {
        this.participants.set(p.participantID, {
          participantId: p.participantID,
          summonerName: p.summonerName || p.playerName || `Player ${p.participantID}`,
          teamId: p.teamID,
          championId: p.championName ? this.getChampionId(p.championName) : 0,
          championName: p.championName || "Unknown",
        })
      })
      this.metadata = {
        gameId: rawEvent.gameID?.toString() || "unknown",
        platformId: rawEvent.platformID || "unknown",
        gameMode: rawEvent.gameMode || "CLASSIC",
        participants: Array.from(this.participants.values()),
        duration: 0,
      }
      this.initializeParticipantStats()
    }
  }

  private initializeParticipantStats() {
    this.participants.forEach((p) => {
      this.participantStats.set(p.participantId, { kills: 0, deaths: 0, assists: 0 })
    })
  }

  private getChampionId(championName: string): number {
    return championName.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  }

  private parseSnapshot(event: GameEvent): StateSnapshot {
    const rawEvent = event.eventDetails
    return {
      gameTime: event.gameTime,
      participants: (rawEvent.participants || []).map((p: any): ParticipantDetailed => {
        const statsMap =
          p.stats && Array.isArray(p.stats)
            ? p.stats.reduce((acc: Record<string, number>, stat: { name: string; value: number }) => {
                acc[stat.name] = stat.value
                return acc
              }, {})
            : {}
        const participant: ParticipantDetailed = {
          participantId: p.participantID,
          summonerName: p.summonerName || p.playerName || `Player ${p.participantID}`,
          teamId: p.teamID,
          championId: this.getChampionId(p.championName),
          championName: p.championName,
          position: p.position ? { x: p.position.x, z: p.position.z } : undefined,
          level: p.level || 1,
          currentGold: p.currentGold || 0,
          totalGold: p.totalGold || 0,
          xp: p.XP || statsMap.XP || 0,
          kills: 0,
          deaths: 0,
          assists: 0,
          totalDamageDealt: statsMap.TOTAL_DAMAGE_DEALT_TO_CHAMPIONS || p.totalDamageDealtToChampions || 0,
          totalDamageTaken: statsMap.TOTAL_DAMAGE_TAKEN || p.totalDamageTaken || 0,
          totalHeal: statsMap.TOTAL_HEAL_ON_TEAMMATES || 0,
          visionScore: statsMap.VISION_SCORE || p.visionScore || 0,
          items: [],
        }
        if (p.items && Array.isArray(p.items)) {
          participant.items = p.items
            .map(
              (item: any): ItemSlot => ({
                itemId: item.itemID,
                slot: item.inventorySlot,
                stacks: item.itemStacks || 1,
              })
            )
            .filter((itemSlot: ItemSlot) => itemSlot.itemId > 0)
        }
        return participant
      }),
      teams: rawEvent.teams || [],
    }
  }

  private normalizeWardType(wardType: string): Ward["wardType"] {
    const type = wardType.toLowerCase()
    if (type.includes("control") || type.includes("pink") || type.includes("jammer")) return "CONTROL_WARD"
    if (type.includes("blueTrinket")) return "BLUE_TRINKET"
    if (type.includes("sight")) return "SIGHT_WARD"
    return "YELLOW_TRINKET"
  }

  private getActiveChannelingsAt(timestamp: number): ChannelingEvent[] {
    const activeChannelings: ChannelingEvent[] = []
    const channelingMap = new Map<number, any>()
    for (const event of this.channelingEvents) {
      const eventTime = Math.floor(event.gameTime / 1000)
      if (eventTime > timestamp) continue
      const participantId = event.participantID
      if (event.rfc461Schema === "channeling_started") {
        channelingMap.set(participantId, event)
      } else if (event.rfc461Schema === "channeling_ended") {
        channelingMap.delete(participantId)
      }
    }
    channelingMap.forEach((event, participantId) => {
      activeChannelings.push({
        gameTime: event.gameTime,
        participantId,
        channelingType: event.channelingType || "recall",
        isActive: true,
        isInterrupted: false,
      })
    })
    return activeChannelings
  }

  private getRecentKillsAt(timestamp: number): KillEvent[] {
    const KILL_DISPLAY_DURATION = 3
    return this.killEvents
      .map((killEvent) => ({ ...killEvent, killTime: Math.floor(killEvent.gameTime / 1000) }))
      .filter((killEvent) => killEvent.killTime <= timestamp && timestamp - killEvent.killTime <= KILL_DISPLAY_DURATION)
      .map((killEvent) => ({
        gameTime: killEvent.gameTime,
        killerId: killEvent.killer,
        victimId: killEvent.victim,
        position: killEvent.position || { x: 0, z: 0 },
        assistIds: killEvent.assistants || [],
      }))
  }
}

export function createJSONLParser(config?: JSONLParserConfig): JSONLParser {
  return new JSONLParser(config)
}