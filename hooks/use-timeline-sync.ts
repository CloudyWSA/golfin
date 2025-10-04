import { useEffect, useRef, useCallback } from "react"
import { useMatchStore } from "@/store/match-store"
import { WindowedCache } from "@/lib/utils/cache"
import { createDominanceCalculator } from "@/services/algorithms/dominance-calculator"
import { createNotificationGenerator } from "@/services/notification-generator"
import type { TimelineFrame, DominanceMap, Participant, PlayerNotification } from "@/types"

export function useTimelineSync() {
  const {
    matchData,
    currentTime,
    isPlaying,
    playbackSpeed,
    setCurrentFrame,
    setDominanceMap,
    setCurrentTime,
    apiPlayerStats,
    apiTeamStats,
  } = useMatchStore()

  const frameCache = useRef(new WindowedCache<TimelineFrame>(100))
  const dominanceCache = useRef(new WindowedCache<DominanceMap>(100))
  const dominanceCalculator = useRef(createDominanceCalculator())
  const intervalRef = useRef<NodeJS.Timeout>()
  const notificationGenerator = useRef(createNotificationGenerator())
  const processedEvents = useRef(new Set<string>())
  const lastProcessedTime = useRef<number>(0)

  const findFrame = useCallback(
    (time: number): TimelineFrame | null => {
      if (!matchData?.frames.length) return null

      const timeInSeconds = Math.floor(time)
      const cachedFrame = frameCache.current.get(timeInSeconds)
      if (cachedFrame) return cachedFrame

      let left = 0
      let right = matchData.frames.length - 1
      let closestFrame = matchData.frames[0]

      while (left <= right) {
        const mid = Math.floor((left + right) / 2)
        const frame = matchData.frames[mid]

        if (frame.timestamp === timeInSeconds) {
          closestFrame = frame
          break
        }

        if (Math.abs(frame.timestamp - timeInSeconds) < Math.abs(closestFrame.timestamp - timeInSeconds)) {
          closestFrame = frame
        }

        if (frame.timestamp < timeInSeconds) {
          left = mid + 1
        } else {
          right = mid - 1
        }
      }

      frameCache.current.set(timeInSeconds, closestFrame)
      return closestFrame
    },
    [matchData],
  )

  const extractTeamName = useCallback((summonerName: string): string | undefined => {
    const match = summonerName.match(/^([A-Z0-9]{2,4})\s+/i)
    return match ? match[1] : undefined
  }, [])

  const processEvents = useCallback(
    (frame: TimelineFrame) => {
      if (!frame.events?.length || !matchData?.participants) return

      const generatedNotificationsForEvent = new Set<string>()

      frame.events.forEach((event) => {
        const eventKey = `${frame.timestamp}-${event.eventType}-${JSON.stringify(event.eventDetails)}`
        if (processedEvents.current.has(eventKey)) return
        processedEvents.current.add(eventKey)

        let relevantParticipantIds: number[] = []
        const killerId = event.eventDetails.killer || event.eventDetails.killerId

        switch (event.eventType) {
          case "ChampionKill": {
            const victimId = event.eventDetails.victim || event.eventDetails.victimId
            if (killerId) relevantParticipantIds.push(killerId)
            if (victimId && victimId !== killerId) relevantParticipantIds.push(victimId)
            break
          }
          case "EpicMonsterKill":
          case "TurretKilled": {
            if (killerId) {
              const killerParticipant = matchData.participants.find(p => p.participantId === killerId)
              if (killerParticipant) {
                const teamMembers = matchData.participants.filter(p => p.teamId === killerParticipant.teamId)
                relevantParticipantIds = teamMembers.map(p => p.participantId)
              }
            }
            break
          }
          case "StateSnapshot": {
            relevantParticipantIds = matchData.participants.map(p => p.participantId)
            break
          }
        }

        if (relevantParticipantIds.length > 0) {
          relevantParticipantIds.forEach((participantId) => {
            const participant = matchData.participants.find(p => p.participantId === participantId)
            if (!participant) return

            const teamName = extractTeamName(participant.summonerName)
            const frameParticipant = frame.snapshot?.participants.find(p => p.participantId === participant.participantId)
            const currentStats = {
              kills: frameParticipant?.kills || 0,
              deaths: frameParticipant?.deaths || 0,
              assists: frameParticipant?.assists || 0,
            }

            const notifications = notificationGenerator.current.generateNotifications(
              event,
              participant,
              currentStats,
              teamName,
              "LTA S",
              apiPlayerStats,
              apiTeamStats,
            )

            notifications.forEach((notification: PlayerNotification) => {
              if (!generatedNotificationsForEvent.has(notification.title)) {
                useMatchStore.getState().addNotification(notification)
                generatedNotificationsForEvent.add(notification.title)
              }
            })
          })
        }
      })
    },
    [matchData, extractTeamName, apiPlayerStats, apiTeamStats],
  )

  const calculateDominance = useCallback((frame: TimelineFrame): DominanceMap => {
    const cached = dominanceCache.current.get(frame.timestamp)
    if (cached) return cached
    const dominance = dominanceCalculator.current.calculate(frame)
    dominanceCache.current.set(frame.timestamp, dominance)
    return dominance
  }, [])

  const processEventsInRange = useCallback(
    (startTime: number, endTime: number) => {
      if (!matchData?.frames) return
      const relevantFrames = matchData.frames.filter(
        (frame) => frame.timestamp >= startTime && frame.timestamp <= endTime
      )
      relevantFrames.forEach((frame) => processEvents(frame))
    },
    [matchData, processEvents],
  )

  useEffect(() => {
    const frame = findFrame(currentTime)
    if (frame) {
      setCurrentFrame(frame)

      const timeDiff = Math.abs(currentTime - lastProcessedTime.current)
      if (timeDiff > 5) {
        const start = Math.min(lastProcessedTime.current, currentTime)
        const end = Math.max(lastProcessedTime.current, currentTime)
        processEventsInRange(start, end)
      } else {
        processEvents(frame)
      }

      lastProcessedTime.current = currentTime

      const dominance = calculateDominance(frame)
      setDominanceMap(dominance)
    }
  }, [currentTime, findFrame, calculateDominance, setCurrentFrame, setDominanceMap, processEvents, processEventsInRange])

  useEffect(() => {
    if (!isPlaying || !matchData) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    const intervalMs = 1000 / playbackSpeed
    intervalRef.current = setInterval(() => {
      const maxTime = matchData.duration || 0
      const newTime = currentTime + 1

      if (newTime >= maxTime) {
        setCurrentTime(maxTime)
        useMatchStore.getState().setIsPlaying(false)
      } else {
        setCurrentTime(newTime)
      }
    }, intervalMs)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isPlaying, currentTime, playbackSpeed, matchData, setCurrentTime])

  const seekTo = useCallback(
    (time: number) => {
      if (!matchData) return
      const clampedTime = Math.max(0, Math.min(time, matchData.duration || 0))
      setCurrentTime(clampedTime)
    },
    [matchData, setCurrentTime],
  )

  const togglePlayback = useCallback(() => {
    useMatchStore.getState().setIsPlaying(!isPlaying)
  }, [isPlaying])

  return {
    currentFrame: useMatchStore((state) => state.currentFrame),
    dominanceMap: useMatchStore((state) => state.dominanceMap),
    seekTo,
    togglePlayback,
  }
}