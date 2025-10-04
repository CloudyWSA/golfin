"use client"

import { useCallback } from "react"
import { useMatchStore } from "@/store/match-store"
import { createJSONLParser } from "@/services/parsers/jsonl-parser"
import { createNotificationGenerator } from "@/services/notification-generator"
import type { MatchData } from "@/types"

export function useMatchLoader() {
  const { setMatchData, setCareerStats, setLoading, setLoadingProgress, setError, reset } = useMatchStore()

  const loadJSONL = useCallback(
    async (file: File, videoUrl?: string) => {
      try {
        setLoading(true)
        setError(null)
        setLoadingProgress(0)

        const parser = createJSONLParser({
          onProgress: (progress) => {
            setLoadingProgress(progress * 0.9)
          },
        })

        const { metadata, frames } = await parser.parseFile(file)

        const matchData: MatchData = {
          matchId: `match-${Date.now()}`,
          metadata,
          duration: metadata.duration,
          frames,
          participants: metadata.participants,
          videoUrl,
          videoStartOffset: 0,
        }

        setMatchData(matchData)
        setLoadingProgress(1)
        setLoading(false)

        return matchData
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load JSONL file"
        setError(message)
        setLoading(false)
        throw error
      }
    },
    [setMatchData, setLoading, setLoadingProgress, setError],
  )

  const loadCSV = useCallback(
    async (file: File) => {
      try {
        const parser = createCSVParser()
        const stats = await parser.parseFile(file)

        setCareerStats(stats)

        const notificationGen = createNotificationGenerator()
        notificationGen.setCareerStats(stats)

        return stats
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load CSV file"
        setError(message)
        throw error
      }
    },
    [setCareerStats, setError],
  )

  const resetMatch = useCallback(() => {
    reset()
  }, [reset])

  return {
    loadJSONL,
    loadCSV,
    resetMatch,
    isLoading: useMatchStore((state) => state.isLoading),
    loadingProgress: useMatchStore((state) => state.loadingProgress),
    error: useMatchStore((state) => state.error),
  }
}
