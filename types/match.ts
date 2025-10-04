export interface Position {
  x: number
  z: number
}

export interface GameMetadata {
  gameId: string
  gameMode: string
  platformId: string
  participants: Participant[]
  duration: number
}

export interface Participant {
  participantId: number
  summonerName: string
  teamId: number
  championId: number
  championName: string
  runes?: {
    keystoneId: number
    keystoneName: string
    primaryStyleId: number
    subStyleId: number
  }
  position?: Position
  level?: number
  currentGold?: number
  totalGold?: number
  xp?: number
  kills?: number
  deaths?: number
  assists?: number
}

export interface GameEvent {
  gameTime: number 
  eventType:
    | "StateSnapshot"
    | "ItemPurchased"
    | "ItemDestroyed"
    | "SkillLevelUp"
    | "SkillUsed"
    | "WardPlaced"
    | "WardKilled"
    | "ChampionKill"
    | "TurretKilled"
    | "DragonKilled"
    | "BaronKilled"
    | "ChannelingStarted"
    | "ChannelingEnded"
    | "GamePauseStarted"
    | "GamePauseEnded"
    | "EpicMonsterQueued"
    | "DragonQueued"
    | "recall"
    | "summonerSpell"
  eventDetails: Record<string, any>
}

export interface Ward {
  wardId: string
  teamId: number
  position: Position
  placedAt: number 
  expiresAt: number
  wardType: "YELLOW_TRINKET" | "CONTROL_WARD" | "BLUE_TRINKET" | "SIGHT_WARD"
}

export interface WardEvent {
  gameTime: number
  placer: number
  position: Position
  wardType: string
  teamId: number
}

export interface StateSnapshot {
  gameTime: number
  participants: Participant[]
  teams: {
    teamId: number
    totalGold: number
    kills: number
    deaths: number
    assists: number
    towers: number
    inhibitors: number
    dragons: number
    barons: number
  }[]
}

export interface GridCell {
  x: number
  y: number
  dominance: "blue" | "red" | "neutral"
  strength: number
}

export interface DominanceMap {
  timestamp: number
  grid: GridCell[]
  influenceMap?: Array<{ x: number; y: number; blue: number; red: number }>
}

export interface ChannelingEvent {
  gameTime: number
  participantId: number
  channelingType: "recall" | "summonerSpell"
  isActive: boolean
  isInterrupted?: boolean
}

export interface KillEvent {
  gameTime: number
  killerId: number
  victimId: number
  position: Position
  assistIds?: number[]
}

export interface TimelineFrame {
  timestamp: number
  snapshot?: StateSnapshot
  events: GameEvent[]
  wards?: Ward[]
  dominanceMap?: DominanceMap
  activeChannelings?: ChannelingEvent[]
  recentKills?: KillEvent[]
}

export interface MatchData {
  matchId: string
  metadata: GameMetadata
  duration: number
  frames: TimelineFrame[]
  participants: Participant[]
  videoUrl?: string
  videoStartOffset?: number
}

export interface PlayerInMatch extends Participant {
  role: string
  team: "blue" | "red"
}

export interface ChampionStats {
  health: number
  maxHealth: number
  mana: number
  maxMana: number
  armor: number
  magicResist: number
  attackDamage: number
  abilityPower: number
  attackSpeed: number
  movementSpeed: number
  critChance: number
  lifeSteal: number
  spellVamp: number
  tenacity: number
  cooldownReduction: number
}

export interface ItemSlot {
  itemId: number
  slot: number
}

export interface ParticipantDetailed extends Participant {
  items?: ItemSlot[]
  stats?: ChampionStats
  totalDamageDealt?: number
  totalDamageTaken?: number
  totalHeal?: number
  visionScore?: number
}
