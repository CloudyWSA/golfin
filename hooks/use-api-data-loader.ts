"use client"

import { useCallback, useEffect } from "react"
import { useMatchStore } from "@/store/match-store"
import { cloudyLolPlayerService } from "@/services/cloudylol-player-service"
import { cloudyLolTeamService } from "@/services/cloudylol-team-service"
import type { Participant } from "@/types/match"

interface MatchMetadata {
  league?: string
  split?: string
  teams?: {
    blue: string
    red: string
  }
}

/**
 * Hook to preload API data for all players and teams in a match
 */
export function useApiDataLoader() {
  const matchData = useMatchStore((state) => state.matchData)
  const setApiPlayerStats = useMatchStore((state) => state.setApiPlayerStats)
  const setApiTeamStats = useMatchStore((state) => state.setApiTeamStats)
  const setApiLoadingState = useMatchStore((state) => state.setApiLoadingState)
  const setApiError = useMatchStore((state) => state.setApiError)

  /**
   * Extract clean player name without team prefix
   * Examples: "T1 Faker" -> "Faker", "G2 Caps" -> "Caps"
   */
  const extractPlayerName = useCallback((summonerName: string): string => {
    // Remove common team prefixes (2-4 letter team tags followed by space)
    const cleanName = summonerName.replace(/^[A-Z0-9]{2,4}\s+/i, '').trim()
    return cleanName || summonerName
  }, [])

  /**
   * Extract team name from player summoner name
   * Examples: "T1 Faker" -> "T1", "G2 Caps" -> "G2"
   */
  const extractTeamName = useCallback((summonerName: string): string | undefined => {
    const match = summonerName.match(/^([A-Z0-9]{2,4})\s+/i)
    return match ? match[1] : undefined
  }, [])

  /**
   * Load player stats for a specific player
   */
  const loadPlayerStats = useCallback(
    async (
      summonerName: string,
      championName: string,
      metadata?: MatchMetadata
    ): Promise<void> => {
      const playerName = extractPlayerName(summonerName)
      const teamName = extractTeamName(summonerName)
      const loadingKey = `player-${playerName}-${championName}`

      console.log(`📥 Loading player stats:`, { summonerName, playerName, championName, teamName, league: metadata?.league })

      try {
        setApiLoadingState(loadingKey, true)
        setApiError(loadingKey, null)

        // Load general player stats
        const generalStats = await cloudyLolPlayerService.getPlayerStatsWithChampion(
          playerName,
          undefined,
          teamName,
          metadata?.league
        )

        if (generalStats) {
          console.log(`✅ General stats loaded for ${playerName}:`, generalStats)
          setApiPlayerStats(playerName, undefined, generalStats)
        } else {
          console.warn(`⚠️ No general stats found for ${playerName}`)
        }

        // Load champion-specific stats
        const championStats = await cloudyLolPlayerService.getPlayerStatsWithChampion(
          playerName,
          championName,
          teamName,
          metadata?.league
        )

        if (championStats) {
          console.log(`✅ Champion stats loaded for ${playerName} (${championName}):`, championStats)
          setApiPlayerStats(playerName, championName, championStats)
        } else {
          console.warn(`⚠️ No champion stats found for ${playerName} (${championName})`)
        }

        setApiLoadingState(loadingKey, false)
      } catch (error) {
        console.error(`Failed to load stats for ${playerName}:`, error)
        setApiError(loadingKey, error instanceof Error ? error.message : 'Failed to load player stats')
        setApiLoadingState(loadingKey, false)
      }
    },
    [extractPlayerName, extractTeamName, setApiPlayerStats, setApiLoadingState, setApiError]
  )

  /**
   * Load team stats
   */
  const loadTeamStats = useCallback(
    async (teamName: string, metadata?: MatchMetadata): Promise<void> => {
      const loadingKey = `team-${teamName}`

      console.log(`📥 Loading team stats:`, { teamName, league: metadata?.league })

      try {
        setApiLoadingState(loadingKey, true)
        setApiError(loadingKey, null)

        const comparison = await cloudyLolTeamService.getTeamComparison(
          teamName,
          metadata?.league || "LTA S",
          metadata?.split
        )

        if (comparison) {
          console.log(`✅ Team stats loaded for ${teamName}:`, comparison.team)
          setApiTeamStats(teamName, comparison.team)
        } else {
          console.warn(`⚠️ No team stats found for ${teamName}`)
        }

        setApiLoadingState(loadingKey, false)
      } catch (error) {
        console.error(`Failed to load stats for team ${teamName}:`, error)
        setApiError(loadingKey, error instanceof Error ? error.message : 'Failed to load team stats')
        setApiLoadingState(loadingKey, false)
      }
    },
    [setApiTeamStats, setApiLoadingState, setApiError]
  )

  /**
   * Load all API data for the current match
   */
  const loadMatchApiData = useCallback(
    async (metadata?: MatchMetadata): Promise<void> => {
      if (!matchData?.participants) {
        console.warn('No match data available to load API stats')
        return
      }

      console.log('🚀 Loading API data for match participants...', {
        participantCount: matchData.participants.length,
        participants: matchData.participants.map((p: Participant) => p.summonerName)
      })

      // Load player stats for all participants
      const playerPromises = matchData.participants.map((participant) =>
        loadPlayerStats(participant.summonerName, participant.championName, metadata)
      )

      // Extract unique team names and load team stats
      const teamNames = new Set<string>()
      matchData.participants.forEach((participant) => {
        const teamName = extractTeamName(participant.summonerName)
        if (teamName) {
          teamNames.add(teamName)
        }
      })

      // If metadata has team names, use those
      if (metadata?.teams) {
        teamNames.add(metadata.teams.blue)
        teamNames.add(metadata.teams.red)
      }

      const teamPromises = Array.from(teamNames).map((teamName) =>
        loadTeamStats(teamName, metadata)
      )

      // Wait for all API calls to complete
      await Promise.allSettled([...playerPromises, ...teamPromises])

      console.log('API data loading complete')
    },
    [matchData, loadPlayerStats, loadTeamStats, extractTeamName]
  )

  /**
   * Auto-load API data when match data changes
   */
  useEffect(() => {
    if (matchData?.participants) {
      // You can pass metadata here if available from match data
      // For now, we'll use default values
      loadMatchApiData({
        league: 'LTA S', // Default league, can be extracted from match metadata
      })
    }
  }, [matchData?.matchId]) // Only reload when match changes

  return {
    loadMatchApiData,
    loadPlayerStats,
    loadTeamStats,
    extractPlayerName,
    extractTeamName,
  }
}
