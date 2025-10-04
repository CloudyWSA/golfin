// API response types for CloudyLol API
export interface CloudyLolPlayerStats {
  playername: string
  teamname: string
  most_played_champions: string[]
  games_played: number
  wins: number
  losses: number
  win_rate_pct: number
  avg_kills: number
  avg_deaths: number
  avg_assists: number
  kda: number
  avg_kp_pct: number
  avg_dpm: number
  avg_damage_share_pct: number
  avg_cspm: number
  avg_gpm: number
  avg_gold_share_pct: number
  avg_vision_score: number
  avg_gold_diff_at_10: number
  avg_xp_diff_at_10: number
  avg_cs_diff_at_10: number
  avg_gold_diff_at_15: number
  avg_xp_diff_at_15: number
  avg_cs_diff_at_15: number
  avg_gold_diff_at_20: number
  avg_xp_diff_at_20: number
  avg_cs_diff_at_20: number
  avg_gold_diff_at_25: number
  avg_xp_diff_at_25: number
  avg_cs_diff_at_25: number
  avg_wpm: number
  avg_vspm: number
  avg_wcpm: number
}

export interface CloudyLolTeamStats {
  teamname: string
  games_played: number
  wins: number
  losses: number
  win_rate_pct: number
  most_played_top: string
  most_played_jng: string
  most_played_mid: string
  most_played_bot: string
  most_played_sup: string
  avg_game_length_mins: number
  avg_team_kills: number
  avg_team_deaths: number
  avg_dragons: number
  avg_barons: number
  avg_heralds: number
  avg_towers: number
  first_blood_rate_pct: number
  first_tower_rate_pct: number
  first_dragon_rate_pct: number
  avg_gold_diff_at_10: number
  avg_xp_diff_at_10: number
  avg_gold_diff_at_15: number
  avg_xp_diff_at_15: number
  avg_gold_diff_at_20: number
  avg_xp_diff_at_20: number
  avg_gold_diff_at_25: number
  avg_xp_diff_at_25: number
  avg_wpm: number
  avg_vspm: number
  avg_wcpm: number
}

// API request parameters
export interface PlayerStatsParams {
  player: string
  team?: string
  champion?: string
  league?: string
  year?: number
}

export interface TeamStatsParams {
  team?: string
  league?: string
  split?: string
}

// Extended types for enhanced notifications with API data
export interface PlayerStatsWithChampion extends CloudyLolPlayerStats {
  champion?: string
  championStats?: {
    games_played: number
    win_rate_pct: number
    avg_kills: number
    avg_deaths: number
    avg_assists: number
    avg_cspm: number
    avg_gold_diff_at_15: number
    avg_cs_diff_at_15: number
  }
}

export interface TeamComparisonStats extends CloudyLolTeamStats {
  leagueRank?: number
  winRateComparison?: 'above_average' | 'average' | 'below_average'
  earlyGameStrength?: 'strong' | 'average' | 'weak'
  objectiveControl?: 'excellent' | 'good' | 'average' | 'poor'
}
