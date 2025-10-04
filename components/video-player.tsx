"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import YouTube, { type YouTubePlayer } from "react-youtube"
import { useMatchStore } from "@/store/match-store"
import { PlayerControls } from "@/components/player-controls"

type YouTubeVideoDetails = {
  videoId: string | null
  startTime: number
}

function extractYouTubeVideoDetails(url: string): YouTubeVideoDetails {
  if (!url) {
    return { videoId: null, startTime: 0 }
  }
  try {
    const urlObj = new URL(url)
    const params = urlObj.searchParams
    let videoId: string | null = null

    if (urlObj.hostname === "youtu.be") {
      videoId = urlObj.pathname.slice(1)
    } else if (urlObj.hostname.includes("youtube.com")) {
      videoId = urlObj.pathname.startsWith("/embed/")
        ? urlObj.pathname.split("/")[2]
        : params.get("v")
    }

    const timeParam = params.get("t")
    const startTime = timeParam ? parseInt(timeParam.replace("s", ""), 10) || 0 : 0

    return { videoId, startTime }
  } catch (error) {
    console.error("Invalid video URL:", error)
    return { videoId: null, startTime: 0 }
  }
}

export function VideoPlayer() {
  const videoUrl = useMatchStore((state) => state.matchData?.videoUrl)
  const playerRef = useRef<YouTubePlayer | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const { videoId, startTime } = extractYouTubeVideoDetails(videoUrl || "")

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isPlaying && playerRef.current) {
      console.log(playerRef)
      interval = setInterval(() => {
        const newTime = playerRef.current?.getCurrentTime() ?? 0
        setCurrentTime(newTime * 1000)
      }, 500)
    }
    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isPlaying])

  useEffect(() => {
    if (!playerRef.current) return
    if (isPlaying) {
      playerRef.current.playVideo()
    } else {
      playerRef.current.pauseVideo()
    }
  }, [isPlaying])

  const onReady = useCallback((event: { target: YouTubePlayer }) => {
    playerRef.current = event.target
  }, [])

  const onStateChange = useCallback(
    (event: { data: number; target: YouTubePlayer }) => {
      if (duration === 0) {
        const videoDuration = event.target.getDuration()
        if (videoDuration > 0) {
          setDuration(videoDuration * 1000)
        }
      }

      if (event.data === 1) {
        setIsPlaying(true)
      } else if (event.data === 2) {
        setIsPlaying(false)
      }
    },
    [duration],
  )

  const handleTogglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev)
  }, [])

  const handleSeek = useCallback((time: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(time / 1000, true)
      setCurrentTime(time)
    }
  }, [])

  const handleSkip = useCallback(
    (seconds: number) => {
      const newTime = Math.max(
        0,
        Math.min(duration, currentTime + seconds * 1000),
      )
      handleSeek(newTime)
    },
    [currentTime, duration, handleSeek],
  )

  if (!videoId) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-lg bg-muted">
        <p className="text-muted-foreground">No video URL provided</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="relative w-full flex-1 overflow-hidden rounded-lg bg-black">
        <YouTube
          videoId={videoId}
          opts={{
            width: "100%",
            height: "100%",
            playerVars: {
              autoplay: 0,
              controls: 0,
              modestbranding: 1,
              rel: 0,
              start: startTime,
            },
          }}
          onReady={onReady}
          onStateChange={onStateChange}
          className="absolute left-0 top-0 h-full w-full"
        />
      </div>
      <PlayerControls
        currentTime={currentTime}
        duration={duration}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onSeek={handleSeek}
        onSkip={handleSkip}
      />
    </div>
  )
}