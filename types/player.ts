// Player career statistics from CSV
export interface PlayerCareerStats {
  player: string
  team: string
  position: string
  gamesPlayed: number
  winRate: number
  kills: number
  deaths: number
  assists: number
  kda: number
  killParticipation: number
  csPerMinute: number
  goldPerMinute: number
  damagePerMinute: number
  visionScore: number
  // Additional stats from Oracle's Elixir
  gd10: number // Gold diff at 10min
  xpd10: number // XP diff at 10min
  csd10: number // CS diff at 10min
}

export interface PlayerNotification {
  id: string
  playerId: string
  timestamp: number
  type: "milestone" | "achievement" | "comparison"
  title: string
  description: string
  icon?: string
  careerContext?: Partial<PlayerCareerStats>
}
