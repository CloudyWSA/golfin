import type { CloudyLolTeamStats, TeamStatsParams, TeamComparisonStats } from "@/types/cloudylol-api"

export class CloudyLolTeamService {
  private cache = new Map<string, { data: CloudyLolTeamStats[]; timestamp: number }>()
  private readonly CACHE_DURATION = 5 * 60 * 1000


  async getTeamStats(params: TeamStatsParams = {}): Promise<CloudyLolTeamStats[]> {
    try {
      const { team, league, split } = params

      const queryParams = new URLSearchParams()

      if (team) queryParams.append("team", team)
      if (league) queryParams.append("league", league)
      if (split) queryParams.append("split", split)

      const url = `/api/cloudylol/teams?${queryParams.toString()}`

      const cacheKey = url
      const cached = this.cache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.data
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const data: CloudyLolTeamStats[] = await response.json()

      if (!data || data.length === 0) {
        return []
      }

      this.cache.set(cacheKey, { data, timestamp: Date.now() })

      return data
    } catch (error) {
      console.error("Error fetching team stats:", error)
      throw error
    }
  }

  /**
   * Gets a specific team's stats
   */
  async getTeamStatsByName(
    teamName: string,
    league?: string,
    split?: string
  ): Promise<CloudyLolTeamStats | null> {
    try {
      const teams = await this.getTeamStats({ team: teamName, league, split })

      if (teams.length === 0) {
        return null
      }

      return teams[0]
    } catch (error) {
      console.error("Error getting team stats by name:", error)
      throw error
    }
  }

  /**
   * Gets all teams in a league for comparison
   */
  async getTeamsInLeague(league: string, split?: string): Promise<TeamComparisonStats[]> {
    try {
      const teams = await this.getTeamStats({ league, split })

      if (teams.length === 0) {
        return []
      }

      const sortedTeams = teams.sort((a, b) => b.win_rate_pct - a.win_rate_pct)

      const avgWinRate = teams.reduce((sum, team) => sum + team.win_rate_pct, 0) / teams.length
      const avgEarlyGame = teams.reduce((sum, team) => sum + team.avg_gold_diff_at_15, 0) / teams.length
      const avgObjectives = teams.reduce((sum, team) =>
        sum + (team.avg_dragons + team.avg_barons + team.avg_heralds) / 3, 0
      ) / teams.length

      return sortedTeams.map((team, index): TeamComparisonStats => {
        const winRateDiff = team.win_rate_pct - avgWinRate
        const earlyGameDiff = team.avg_gold_diff_at_15 - avgEarlyGame
        const objControlScore = (team.avg_dragons + team.avg_barons + team.avg_heralds) / 3 - avgObjectives

        return {
          ...team,
          leagueRank: index + 1,
          winRateComparison: this.getWinRateComparison(winRateDiff),
          earlyGameStrength: this.getEarlyGameStrength(earlyGameDiff),
          objectiveControl: this.getObjectiveControl(objControlScore),
        }
      })
    } catch (error) {
      console.error("Error getting teams in league:", error)
      throw error
    }
  }

  /**
   * Gets team comparison data for a specific team
   */
  async getTeamComparison(
    teamName: string,
    league: string,
    split?: string
  ): Promise<{ team: TeamComparisonStats; leagueAverage: CloudyLolTeamStats } | null> {
    try {
      const [team, teams] = await Promise.all([
        this.getTeamStatsByName(teamName, league, split),
        this.getTeamsInLeague(league, split)
      ])

      if (!team || teams.length === 0) {
        return null
      }

      const leagueAverage = this.calculateLeagueAverage(teams)

      const teamWithComparison = teams.find(t => t.teamname === teamName)

      return teamWithComparison ? {
        team: teamWithComparison,
        leagueAverage
      } : null
    } catch (error) {
      console.error("Error getting team comparison:", error)
      throw error
    }
  }

  private getWinRateComparison(diff: number): 'above_average' | 'average' | 'below_average' {
    if (diff > 5) return 'above_average'
    if (diff < -5) return 'below_average'
    return 'average'
  }

  private getEarlyGameStrength(diff: number): 'strong' | 'average' | 'weak' {
    if (diff > 200) return 'strong'
    if (diff < -200) return 'weak'
    return 'average'
  }

  private getObjectiveControl(score: number): 'excellent' | 'good' | 'average' | 'poor' {
    if (score > 0.5) return 'excellent'
    if (score > 0.2) return 'good'
    if (score > -0.2) return 'average'
    return 'poor'
  }

  private calculateLeagueAverage(teams: CloudyLolTeamStats[]): CloudyLolTeamStats {
    const count = teams.length

    return {
      teamname: "League Average",
      games_played: Math.round(teams.reduce((sum, t) => sum + t.games_played, 0) / count),
      wins: Math.round(teams.reduce((sum, t) => sum + t.wins, 0) / count),
      losses: Math.round(teams.reduce((sum, t) => sum + t.losses, 0) / count),
      win_rate_pct: Math.round((teams.reduce((sum, t) => sum + t.win_rate_pct, 0) / count) * 10) / 10,
      most_played_top: "Various",
      most_played_jng: "Various",
      most_played_mid: "Various",
      most_played_bot: "Various",
      most_played_sup: "Various",
      avg_game_length_mins: Math.round((teams.reduce((sum, t) => sum + t.avg_game_length_mins, 0) / count) * 10) / 10,
      avg_team_kills: Math.round((teams.reduce((sum, t) => sum + t.avg_team_kills, 0) / count) * 10) / 10,
      avg_team_deaths: Math.round((teams.reduce((sum, t) => sum + t.avg_team_deaths, 0) / count) * 10) / 10,
      avg_dragons: Math.round((teams.reduce((sum, t) => sum + t.avg_dragons, 0) / count) * 10) / 10,
      avg_barons: Math.round((teams.reduce((sum, t) => sum + t.avg_barons, 0) / count) * 10) / 10,
      avg_heralds: Math.round((teams.reduce((sum, t) => sum + t.avg_heralds, 0) / count) * 10) / 10,
      avg_towers: Math.round(teams.reduce((sum, t) => sum + t.avg_towers, 0) / count),
      first_blood_rate_pct: Math.round((teams.reduce((sum, t) => sum + t.first_blood_rate_pct, 0) / count) * 10) / 10,
      first_tower_rate_pct: Math.round((teams.reduce((sum, t) => sum + t.first_tower_rate_pct, 0) / count) * 10) / 10,
      first_dragon_rate_pct: Math.round((teams.reduce((sum, t) => sum + t.first_dragon_rate_pct, 0) / count) * 10) / 10,
      avg_gold_diff_at_10: Math.round((teams.reduce((sum, t) => sum + t.avg_gold_diff_at_10, 0) / count) * 10) / 10,
      avg_xp_diff_at_10: Math.round((teams.reduce((sum, t) => sum + t.avg_xp_diff_at_10, 0) / count) * 10) / 10,
      avg_gold_diff_at_15: Math.round((teams.reduce((sum, t) => sum + t.avg_gold_diff_at_15, 0) / count) * 10) / 10,
      avg_xp_diff_at_15: Math.round((teams.reduce((sum, t) => sum + t.avg_xp_diff_at_15, 0) / count) * 10) / 10,
      avg_gold_diff_at_20: Math.round((teams.reduce((sum, t) => sum + t.avg_gold_diff_at_20, 0) / count) * 10) / 10,
      avg_xp_diff_at_20: Math.round((teams.reduce((sum, t) => sum + t.avg_xp_diff_at_20, 0) / count) * 10) / 10,
      avg_gold_diff_at_25: Math.round((teams.reduce((sum, t) => sum + t.avg_gold_diff_at_25, 0) / count) * 10) / 10,
      avg_xp_diff_at_25: Math.round((teams.reduce((sum, t) => sum + t.avg_xp_diff_at_25, 0) / count) * 10) / 10,
      avg_wpm: Math.round((teams.reduce((sum, t) => sum + t.avg_wpm, 0) / count) * 10) / 10,
      avg_vspm: Math.round((teams.reduce((sum, t) => sum + t.avg_vspm, 0) / count) * 10) / 10,
      avg_wcpm: Math.round((teams.reduce((sum, t) => sum + t.avg_wcpm, 0) / count) * 10) / 10,
    }
  }

  /**
   * Clears the cache
   */
  clearCache(): void {
    this.cache.clear()
  }
}

export const cloudyLolTeamService = new CloudyLolTeamService()
