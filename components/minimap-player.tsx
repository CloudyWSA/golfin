"use client"

import { useCallback } from "react"
import { useMatchStore } from "@/store/match-store"
import { Minimap } from "@/components/minimap"
import { PlayerControls } from "@/components/player-controls"

export function MinimapPlayer() {
  const matchData = useMatchStore((state) => state.matchData)
  const currentTime = useMatchStore((state) => state.currentTime)
  const isPlaying = useMatchStore((state) => state.isPlaying)
  const setCurrentTime = useMatchStore((state) => state.setCurrentTime)
  const setIsPlaying = useMatchStore((state) => state.setIsPlaying)

  const duration = matchData?.duration ?? 0

  const handleTogglePlay = useCallback(() => {
    setIsPlaying(!isPlaying)
  }, [isPlaying, setIsPlaying])

  const handleSkip = useCallback(
    (seconds: number) => {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds * 1000))
      setCurrentTime(newTime)
    },
    [currentTime, duration, setCurrentTime],
  )

  return (
    <div className="flex h-full flex-col">
      <div className="relative flex-1">
        <div className="absolute inset-0">
          <Minimap />
        </div>
      </div>
      <PlayerControls
        currentTime={currentTime}
        duration={duration}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onSeek={setCurrentTime}
        onSkip={handleSkip}
      />
    </div>
  )
}