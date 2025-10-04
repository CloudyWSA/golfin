import type { CloudyLolPlayerStats, PlayerStatsParams, PlayerStatsWithChampion } from "@/types/cloudylol-api"

export class CloudyLolPlayerService {
  private cache = new Map<string, { data: CloudyLolPlayerStats; timestamp: number }>()
  private readonly CACHE_DURATION = 5 * 60 * 1000

  async getPlayerStats(params: PlayerStatsParams): Promise<CloudyLolPlayerStats | null> {
    try {
      const { player, team, champion, league, year = 2025 } = params

      if (!player) {
        throw new Error("Player name is required")
      }

      const queryParams = new URLSearchParams()
      queryParams.append("player", player)

      if (team) queryParams.append("team", team)
      if (champion) queryParams.append("champion", champion)
      if (league) queryParams.append("league", league)
      if (year) queryParams.append("year", year.toString())

      const url = `/api/cloudylol/players?${queryParams.toString()}`

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
        if (response.status === 404) {
          return null
        }
        throw new Error(`API request failed: ${response.status}`)
      }

      const data: CloudyLolPlayerStats[] = await response.json()

      if (!data || data.length === 0) {
        return null
      }

      this.cache.set(cacheKey, { data: data[0], timestamp: Date.now() })

      return data[0]
    } catch (error) {
      console.error("Error fetching player stats:", error)
      throw error
    }
  }

  /**
   * Gets player stats with champion-specific data if available
   */
  async getPlayerStatsWithChampion(
    playerName: string,
    championName?: string,
    teamName?: string,
    league?: string
  ): Promise<PlayerStatsWithChampion | null> {
    try {
      const generalStats = await this.getPlayerStats({
        player: playerName,
        team: teamName,
        league,
      })

      if (!generalStats) {
        return null
      }

      let championStats: PlayerStatsWithChampion['championStats'] | undefined

      if (championName) {
        const championSpecificStats = await this.getPlayerStats({
          player: playerName,
          champion: championName,
          team: teamName,
          league,
        })

        if (championSpecificStats) {
          championStats = {
            games_played: championSpecificStats.games_played,
            win_rate_pct: championSpecificStats.win_rate_pct,
            avg_kills: championSpecificStats.avg_kills,
            avg_deaths: championSpecificStats.avg_deaths,
            avg_assists: championSpecificStats.avg_assists,
            avg_cspm: championSpecificStats.avg_cspm,
            avg_gold_diff_at_15: championSpecificStats.avg_gold_diff_at_15,
            avg_cs_diff_at_15: championSpecificStats.avg_cs_diff_at_15,
          }
        }
      }

      return {
        ...generalStats,
        champion: championName,
        championStats,
      }
    } catch (error) {
      console.error("Error getting player stats with champion:", error)
      throw error
    }
  }

  /**
   * Gets multiple players' stats for comparison
   */
  async getMultiplePlayerStats(
    players: Array<{ name: string; team?: string; champion?: string; league?: string }>
  ): Promise<PlayerStatsWithChampion[]> {
    try {
      const promises = players.map(player =>
        this.getPlayerStatsWithChampion(player.name, player.champion, player.team, player.league)
      )

      const results = await Promise.allSettled(promises)

      return results
        .filter((result): result is PromiseFulfilledResult<PlayerStatsWithChampion> =>
          result.status === 'fulfilled' && result.value !== null
        )
        .map(result => result.value)
    } catch (error) {
      console.error("Error getting multiple player stats:", error)
      throw error
    }
  }

  /**
   * Clears the cache
   */
  clearCache(): void {
    this.cache.clear()
  }
}

export const cloudyLolPlayerService = new CloudyLolPlayerService()
