"use client"

import type React from "react"

import { useCallback, useRef } from "react"
import { Play, Pause } from "lucide-react"
import { useMatchStore } from "@/store/match-store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function TimelineScrubber() {
  const matchData = useMatchStore((state) => state.matchData)
  const currentTime = useMatchStore((state) => state.currentTime)
  const isPlaying = useMatchStore((state) => state.isPlaying)
  const setCurrentTime = useMatchStore((state) => state.setCurrentTime)
  const setIsPlaying = useMatchStore((state) => state.setIsPlaying)

  const scrubberRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)

  const duration = matchData?.duration || 0
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  const handleMouseDown = useCallback(() => {
    isDraggingRef.current = true
  }, [])

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false
  }, [])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDraggingRef.current || !scrubberRef.current) return

      const rect = scrubberRef.current.getBoundingClientRect()
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
      const percentage = x / rect.width
      const newTime = percentage * duration

      setCurrentTime(newTime)
    },
    [duration, setCurrentTime],
  )

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!scrubberRef.current) return

      const rect = scrubberRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percentage = x / rect.width
      const newTime = percentage * duration

      setCurrentTime(newTime)
    },
    [duration, setCurrentTime],
  )

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const togglePlayback = useCallback(() => {
    setIsPlaying(!isPlaying)
  }, [isPlaying, setIsPlaying])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button onClick={togglePlayback} size="lg" variant="default" className="w-20">
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </Button>

        <div className="flex-1 space-y-2">
          <div
            ref={scrubberRef}
            className="relative h-2 bg-muted rounded-full cursor-pointer group"
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseUp}
            onClick={handleClick}
          >
            <div
              className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
            <div
              className={cn(
                "absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full shadow-lg",
                "transition-transform group-hover:scale-125",
                isDraggingRef.current && "scale-125",
              )}
              style={{ left: `${progress}%`, transform: "translate(-50%, -50%)" }}
            />
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
