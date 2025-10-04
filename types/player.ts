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
  gd10: number
  xpd10: number
  csd10: number
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
