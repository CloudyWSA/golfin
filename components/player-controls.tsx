"use client"

import type React from "react"
import { useCallback, useRef, useEffect } from "react"
import { Play, Pause, SkipBack, SkipForward } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type PlayerControlsProps = {
  currentTime: number
  duration: number
  isPlaying: boolean
  onTogglePlay: () => void
  onSeek: (time: number) => void
  onSkip: (seconds: number) => void
}

const formatTime = (ms: number): string => {
  const totalSeconds = ms / 1000
  const mins = Math.floor(totalSeconds / 60)
  const secs = Math.floor(totalSeconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export function PlayerControls({
  currentTime,
  duration,
  isPlaying,
  onTogglePlay,
  onSeek,
  onSkip,
}: PlayerControlsProps) {
  const scrubberRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    isDraggingRef.current = true
    document.body.style.cursor = "grabbing"
  }, [])

  const handleGlobalMouseUp = useCallback(() => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false
      document.body.style.cursor = "default"
    }
  }, [])

  const handleGlobalMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingRef.current || !scrubberRef.current) return
      const rect = scrubberRef.current.getBoundingClientRect()
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
      const percentage = x / rect.width
      onSeek(percentage * duration)
    },
    [duration, onSeek],
  )

  useEffect(() => {
    document.addEventListener("mousemove", handleGlobalMouseMove)
    document.addEventListener("mouseup", handleGlobalMouseUp)
    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove)
      document.removeEventListener("mouseup", handleGlobalMouseUp)
      document.body.style.cursor = "default"
    }
  }, [handleGlobalMouseMove, handleGlobalMouseUp])

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!scrubberRef.current) return
      const rect = scrubberRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percentage = x / rect.width
      onSeek(percentage * duration)
    },
    [duration, onSeek],
  )

  return (
    <div className="flex w-full items-center gap-2 pt-4">
      <Button variant="ghost" size="icon" onClick={onTogglePlay}>
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      <Button variant="ghost" size="icon" onClick={() => onSkip(-10)}>
        <SkipBack className="h-4 w-4" />
      </Button>

      <div className="flex flex-1 items-center gap-2">
        <span className="w-10 text-center text-xs text-muted-foreground">{formatTime(currentTime)}</span>
        <div
          ref={scrubberRef}
          className="group relative h-1.5 w-full cursor-pointer rounded-full bg-muted"
          onMouseDown={handleMouseDown}
          onClick={handleClick}
        >
          <div className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${progress}%` }} />
          <div
            className={cn(
              "absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-primary shadow",
              "transition-transform group-hover:scale-125",
              isDraggingRef.current && "scale-125",
            )}
            style={{ left: `${progress}%`, transform: "translate(-50%, -50%)" }}
          />
        </div>
        <span className="w-10 text-center text-xs text-muted-foreground">{formatTime(duration)}</span>
      </div>

      <Button variant="ghost" size="icon" onClick={() => onSkip(10)}>
        <SkipForward className="h-4 w-4" />
      </Button>
    </div>
  )
}