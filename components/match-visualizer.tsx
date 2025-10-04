"use client"

import { Minimap } from "./minimap"
import { VideoPlayer } from "./video-player"
import { MatchNotifications } from "./match-notifications"
import { useTimelineSync } from "@/hooks/use-timeline-sync"
import { useApiDataLoader } from "@/hooks/use-api-data-loader"
import { useMatchStore } from "@/store/match-store"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, SkipBack, SkipForward } from "lucide-react"

export function MatchVisualizer() {
  const { togglePlayback, seekTo } = useTimelineSync()
  const { matchData, currentTime, isPlaying, playbackSpeed, setPlaybackSpeed } = useMatchStore()
  
  useApiDataLoader()

  if (!matchData) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Carregue os arquivos da partida para começar</p>
      </div>
    )
  }

  const duration = matchData.duration || 0
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Minimapa</h2>
            <div className="text-sm text-muted-foreground">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
          <Minimap />

          {/* Playback Controls */}
          <div className="space-y-4 p-4 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-2">
              <Button size="icon" variant="outline" onClick={() => seekTo(Math.max(0, currentTime - 10))}>
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button size="icon" onClick={togglePlayback}>
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button size="icon" variant="outline" onClick={() => seekTo(Math.min(duration, currentTime + 10))}>
                <SkipForward className="h-4 w-4" />
              </Button>

              <div className="flex-1 px-4">
                <Slider
                  value={[progress]}
                  onValueChange={([value]) => seekTo((value / 100) * duration)}
                  max={100}
                  step={0.1}
                  className="cursor-pointer"
                />
              </div>

              <select
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                className="px-2 py-1 text-sm border border-border rounded bg-background"
              >
                <option value={0.5}>0.5x</option>
                <option value={1}>1x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2x</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Vídeo da Partida</h2>
          <VideoPlayer />
        </div>
      </div>

      {/* Notifications overlay */}
      <MatchNotifications />
    </div>
  )
}
