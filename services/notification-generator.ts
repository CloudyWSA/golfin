import type { GameEvent, PlayerNotification, PlayerInMatch } from "@/types"
import type { PlayerStatsWithChampion, TeamComparisonStats } from "@/types/cloudylol-api"

export class NotificationGenerator {
  private notificationId = 0
  
  private firstDragonTaken = false
  private firstTowerTaken = false

  private signaturePicksShown = new Set<string>()
  private kpNotifShown = new Set<number>()
  private midGameNotifShown = new Set<number>()

  private createNotification(
    playerId: string,
    timestamp: number,
    type: PlayerNotification['type'],
    title: string,
    description: string,
    stats?: PlayerStatsWithChampion | TeamComparisonStats | null
  ): PlayerNotification {
    this.notificationId += 1
    return {
      id: `${timestamp}-${this.notificationId}`,
      playerId,
      timestamp,
      type,
      title,
      description,
      relatedStats: stats || undefined
    }
  }

  private extractPlayerName(summonerName: string): string {
    return summonerName.replace(/^[A-Z0-9]{2,4}\s+/i, '').trim() || summonerName
  }

  private getPlayerPosition(player: PlayerInMatch): string {
    const positionIndex = ((player.participantId - 1) % 5)
    const positionMap: Record<number, string> = {
      0: "Top", 1: "Jungle", 2: "Mid", 3: "ADC", 4: "Support"
    }
    return positionMap[positionIndex] || "Unknown"
  }

  private getMostPlayedChampionForPosition(stats: TeamComparisonStats, position: string): string | null {
    switch (position.toLowerCase()) {
      case 'top': return stats.most_played_top
      case 'jungle': return stats.most_played_jng
      case 'mid': return stats.most_played_mid
      case 'adc': return stats.most_played_bot
      case 'support': return stats.most_played_sup
      default: return null
    }
  }

  public generateNotifications(
    event: GameEvent,
    player: PlayerInMatch,
    currentStats: { kills: number; deaths: number; assists: number },
    teamName?: string,
    league?: string,
    apiPlayerStats?: Map<string, PlayerStatsWithChampion>,
    apiTeamStats?: Map<string, TeamComparisonStats>,
  ): PlayerNotification[] {
    const notifications: PlayerNotification[] = []
    const cleanPlayerName = this.extractPlayerName(player.summonerName)
    const playerStatsMap = apiPlayerStats || new Map()
    const teamStatsMap = apiTeamStats || new Map()

    const championKey = `${cleanPlayerName.toLowerCase()}-${player.championName?.toLowerCase()}`
    const generalKey = `${cleanPlayerName.toLowerCase()}-general`
    const apiPlayerStat = playerStatsMap.get(championKey) || playerStatsMap.get(generalKey)
    const teamStats = teamName ? teamStatsMap.get(teamName.toLowerCase()) : null

    const isKiller = (event.eventDetails.killer || event.eventDetails.killerId) === player.participantId

    if (event.eventType === "ChampionKill" && isKiller && apiPlayerStat && !this.kpNotifShown.has(player.participantId)) {
      const kp = apiPlayerStat.avg_kp_pct
      const description = `${player.summonerName} consegue seu primeiro abate! Sua participação média em abates na carreira é de ${kp.toFixed(1)}%.`
      notifications.push(this.createNotification(player.participantId.toString(), event.gameTime, "achievement", "Primeiro Abate!", description, apiPlayerStat))
      this.kpNotifShown.add(player.participantId)
    }

    if (event.eventType === "EpicMonsterKill") {
      const monsterType = event.eventDetails.monsterType || ""
      if (monsterType.toLowerCase().includes("dragon") && teamStats && teamName) {
        if (!this.firstDragonTaken) {
          const description = `${teamName} garante o primeiro Dragão! Taxa de first dragon: ${teamStats.first_dragon_rate_pct.toFixed(1)}%.`
          notifications.push(this.createNotification(player.participantId.toString(), event.gameTime, "milestone", "Primeiro Dragão!", description, teamStats))
          this.firstDragonTaken = true
        } else {
          const description = `${teamName} garante mais um Dragão! Média por jogo: ${teamStats.avg_dragons.toFixed(1)}.`
          notifications.push(this.createNotification(player.participantId.toString(), event.gameTime, "achievement", "Dragão Garantido!", description, teamStats))
        }
      }
    }

    if (event.eventType === "TurretKilled" && !this.firstTowerTaken && teamStats && teamName) {
      const description = `${teamName} destrói a primeira torre! Taxa de first tower: ${teamStats.first_tower_rate_pct.toFixed(1)}%.`
      notifications.push(this.createNotification(player.participantId.toString(), event.gameTime, "milestone", "Primeira Torre!", description, teamStats))
      this.firstTowerTaken = true
    }

    if (event.eventType === "StateSnapshot" && event.gameTime >= 1200000 && event.gameTime < 1260000) { // ~20 minutos
      if (apiPlayerStat && !this.midGameNotifShown.has(player.participantId)) {
        const participantSnapshot = event.eventDetails.participants?.find((p: any) => p.participantID === player.participantId)
        if (!participantSnapshot) return []
        
        const gameTimeMinutes = event.gameTime / 60000
        const position = this.getPlayerPosition(player)
        let title = ""
        let description = ""

        switch (position) {
          case "Top":
          case "Mid":
            const currentDPM = (participantSnapshot.totalDamageDealtToChampions || 0) / gameTimeMinutes
            title = `Análise de DPM (${position})`
            description = `${player.summonerName} está com ${currentDPM.toFixed(0)} DPM. Sua média é ${apiPlayerStat.avg_dpm.toFixed(0)}.`
            break
          case "Jungle":
          case "Support":
            const currentVSPM = (participantSnapshot.visionScore || 0) / gameTimeMinutes
            title = `Análise de Visão (${position})`
            description = `${player.summonerName} está com ${currentVSPM.toFixed(1)} VSPM. Sua média é ${apiPlayerStat.avg_vspm.toFixed(1)}.`
            break
          case "ADC":
            const currentGPM = (participantSnapshot.totalGold || 0) / gameTimeMinutes
            title = `Análise de GPM (ADC)`
            description = `${player.summonerName} está com ${currentGPM.toFixed(0)} GPM. Sua média é ${apiPlayerStat.avg_gpm.toFixed(0)}.`
            break
        }
        
        if (title && description) {
          notifications.push(this.createNotification(player.participantId.toString(), event.gameTime, "comparison", title, description, apiPlayerStat))
          this.midGameNotifShown.add(player.participantId)
        }
      }
    }

    if (event.eventType === "StateSnapshot" && event.gameTime <= 3000) {
      const signatureKey = `${player.participantId}-${player.championName}`
      if (!this.signaturePicksShown.has(signatureKey) && teamStats && teamName) {
        const position = this.getPlayerPosition(player)
        const mostPlayedChampion = this.getMostPlayedChampionForPosition(teamStats, position)
        if (player.championName === mostPlayedChampion) {
          this.signaturePicksShown.add(signatureKey)
          const description = `${player.championName} é a escolha de assinatura da ${teamName} para a rota ${position}.`
          notifications.push(this.createNotification(player.participantId.toString(), event.gameTime, "milestone", "Escolha de Assinatura!", description, teamStats))
        }
      }
    }

    return notifications
  }
}

export function createNotificationGenerator(): NotificationGenerator {
  return new NotificationGenerator()
}