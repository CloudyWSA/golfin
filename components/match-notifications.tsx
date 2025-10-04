"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, Trophy, TrendingUp, AlertCircle } from "lucide-react"
import { useMatchStore } from "@/store/match-store"
import { PlayerStatsPanel } from "./player-stats-panel"
import type { PlayerNotification } from "@/types/player"
import type { PlayerInMatch } from "@/types/match"

interface NotificationWithData extends PlayerNotification {
  player?: PlayerInMatch
}

export function MatchNotifications() {
  const notifications = useMatchStore((state) => state.notifications)
  const matchData = useMatchStore((state) => state.matchData)
  const apiPlayerStats = useMatchStore((state) => state.apiPlayerStats)
  const apiTeamStats = useMatchStore((state) => state.apiTeamStats)
  
  const [visibleNotifications, setVisibleNotifications] = useState<NotificationWithData[]>([])
  const [selectedNotification, setSelectedNotification] = useState<NotificationWithData | null>(null)
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const lastFive = notifications
      .slice(-5)
      .filter(notif => !dismissedIds.has(notif.id))
      .map(notif => {
        const player = matchData?.participants.find(p => p.participantId.toString() === notif.playerId)
        return { ...notif, player }
      })
    setVisibleNotifications(lastFive)
  }, [notifications, matchData, dismissedIds])

  useEffect(() => {
    if (visibleNotifications.length === 0) return

    const timers = visibleNotifications.map((notification) => {
      return setTimeout(() => {
        setDismissedIds(prev => new Set(prev).add(notification.id))
      }, 5000)
    })

    return () => {
      timers.forEach(timer => clearTimeout(timer))
    }
  }, [visibleNotifications])

  const getNotificationIcon = (type: PlayerNotification["type"]) => {
    switch (type) {
      case "milestone":
        return <Trophy className="h-4 w-4 text-neon-green" />
      case "achievement":
        return <TrendingUp className="h-4 w-4 text-neon-green" />
      case "comparison":
        return <AlertCircle className="h-4 w-4 text-yellow-400" />
      default:
        return null
    }
  }

  const removeNotification = (id: string) => {
    setDismissedIds(prev => new Set(prev).add(id))
  }

  const handleNotificationClick = (notification: NotificationWithData) => {
    setSelectedNotification(notification)
  }

  const getPlayerStats = (playerId: string, championName?: string) => {
    const player = matchData?.participants.find(p => p.participantId.toString() === playerId)
    if (!player) return null

    const key = `${player.summonerName.toLowerCase()}-${championName || 'general'}`
    return apiPlayerStats.get(key)
  }

  const getTeamStats = (teamName?: string) => {
    if (!teamName) return null
    return apiTeamStats.get(teamName.toLowerCase())
  }

  return (
    <>
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
        <AnimatePresence>
          {visibleNotifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.8 }}
              transition={{ duration: 0.3 }}
            >
              <Card 
                className="bg-black/95 border-neon-green/40 backdrop-blur-md cursor-pointer hover:border-neon-green/70 transition-colors shadow-lg shadow-neon-green/10"
                onClick={() => handleNotificationClick(notification)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getNotificationIcon(notification.type)}
                      <CardTitle className="text-sm text-neon-green">
                        {notification.title}
                      </CardTitle>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeNotification(notification.id)
                      }}
                      className="text-neon-green/70 hover:text-neon-green transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <p className="text-xs text-neon-green/80">{notification.description}</p>
                  {notification.player && (
                    <Badge variant="outline" className="mt-2 text-xs border-neon-green/50 text-neon-green">
                      {notification.player.summonerName} • {notification.player.championName}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedNotification && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedNotification(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-4">
                <Card className="bg-black/95 border-neon-green/30">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-neon-green flex items-center gap-2">
                          {getNotificationIcon(selectedNotification.type)}
                          {selectedNotification.title}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {selectedNotification.description}
                        </CardDescription>
                      </div>
                      <button
                        onClick={() => setSelectedNotification(null)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </CardHeader>
                </Card>

                {selectedNotification.player && (
                  <PlayerStatsPanel
                    player={selectedNotification.player}
                    apiPlayerStats={getPlayerStats(
                      selectedNotification.playerId,
                      selectedNotification.player.championName
                    ) || undefined}
                    teamStats={getTeamStats(
                      matchData?.participants.find(p => p.participantId === selectedNotification.player?.participantId)?.teamId === 100 
                        ? "Blue Team" 
                        : "Red Team"
                    ) || undefined}
                  />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}