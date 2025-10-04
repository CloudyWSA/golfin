"use client"

import { Button } from "@/components/ui/button"
import { useMatchStore } from "@/store/match-store"
import { Bell } from "lucide-react"

export function NotificationTestButton() {
  const matchData = useMatchStore((state) => state.matchData)
  const addNotification = useMatchStore((state) => state.addNotification)

  const testNotification = () => {
    if (!matchData?.participants[0]) return

    addNotification({
      id: `test-${Date.now()}`,
      playerId: matchData.participants[0].participantId.toString(),
      timestamp: Date.now(),
      type: "achievement",
      title: "Test Notification",
      description: "This is a test notification to verify the system is working!",
    })
  }

  if (!matchData) return null

  return (
    <Button
      onClick={testNotification}
      variant="outline"
      size="sm"
      className="fixed bottom-4 right-4 z-50 bg-neon-green/20 border-neon-green/50 hover:bg-neon-green/30"
    >
      <Bell className="h-4 w-4 mr-2" />
      Test Notification
    </Button>
  )
}
