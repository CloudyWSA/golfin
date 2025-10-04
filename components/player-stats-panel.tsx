"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, Minus, Target, Sword, Shield, Coins, Eye } from "lucide-react"
import type { PlayerStatsWithChampion, TeamComparisonStats } from "@/types/cloudylol-api"
import type { PlayerInMatch } from "@/types"

interface PlayerStatsPanelProps {
  player: PlayerInMatch
  apiPlayerStats?: PlayerStatsWithChampion
  teamStats?: TeamComparisonStats
  className?: string
}

export function PlayerStatsPanel({ player, apiPlayerStats, teamStats, className }: PlayerStatsPanelProps) {
  const [activeTab, setActiveTab] = useState("overview")

  if (!apiPlayerStats && !teamStats) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-neon-green" />
            {player.summonerName}
          </CardTitle>
          <CardDescription>
            {player.championName} • {player.team === "blue" ? "Blue Team" : "Red Team"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Loading player statistics...
          </p>
        </CardContent>
      </Card>
    )
  }

  const getPerformanceColor = (current: number, average: number) => {
    if (current > average * 1.2) return "text-green-400"
    if (current < average * 0.8) return "text-red-400"
    return "text-muted-foreground"
  }

  const getPerformanceIcon = (current: number, average: number) => {
    if (current > average * 1.2) return <TrendingUp className="h-3 w-3 text-green-400" />
    if (current < average * 0.8) return <TrendingDown className="h-3 w-3 text-red-400" />
    return <Minus className="h-3 w-3 text-muted-foreground" />
  }

  return (
    <Card className={`${className} bg-black/50 border-neon-green/20`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-neon-green">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {player.summonerName}
          </div>
          {apiPlayerStats && (
            <Badge variant="outline" className="text-neon-green border-neon-green/50">
              {apiPlayerStats.games_played} Games
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="text-sm">
          {player.championName} • {player.team === "blue" ? "Blue Team" : "Red Team"}
          {apiPlayerStats?.champion && ` • Champion Stats`}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-black/30">
            <TabsTrigger value="overview" className="text-xs data-[state=active]:bg-neon-green/20 data-[state=active]:text-neon-green">
              Overview
            </TabsTrigger>
            <TabsTrigger value="performance" className="text-xs data-[state=active]:bg-neon-green/20 data-[state=active]:text-neon-green">
              Performance
            </TabsTrigger>
            <TabsTrigger value="objectives" className="text-xs data-[state=active]:bg-neon-green/20 data-[state=active]:text-neon-green">
              Objectives
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {apiPlayerStats && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Win Rate</span>
                    <Badge variant="outline" className="text-neon-green border-neon-green/50">
                      {apiPlayerStats.win_rate_pct}%
                    </Badge>
                  </div>
                  <Progress
                    value={apiPlayerStats.win_rate_pct}
                    className="h-2 bg-black/30"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">KDA</span>
                    <span className="text-neon-green font-bold">{apiPlayerStats.kda.toFixed(1)}</span>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="flex items-center gap-1">
                      <Sword className="h-3 w-3" />
                      {apiPlayerStats.avg_kills.toFixed(1)}
                    </span>
                    <span className="text-muted-foreground">/</span>
                    <span className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      {apiPlayerStats.avg_deaths.toFixed(1)}
                    </span>
                    <span className="text-muted-foreground">/</span>
                    <span className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {apiPlayerStats.avg_assists.toFixed(1)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">CS/Min</span>
                    <span className="text-neon-green font-bold">{apiPlayerStats.avg_cspm.toFixed(1)}</span>
                  </div>
                  <Progress
                    value={(apiPlayerStats.avg_cspm / 12) * 100}
                    className="h-2 bg-black/30"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Gold/Min</span>
                    <span className="text-neon-green font-bold">{apiPlayerStats.avg_gpm.toFixed(0)}</span>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <Coins className="h-3 w-3" />
                    <span>{apiPlayerStats.avg_gpm.toFixed(0)} avg</span>
                  </div>
                </div>
              </div>
            )}

            {apiPlayerStats?.championStats && (
              <div className="mt-4 p-3 bg-neon-green/10 rounded-lg border border-neon-green/20">
                <h4 className="text-sm font-semibold text-neon-green mb-2">Champion Performance</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span>Win Rate:</span>
                    <span className="text-neon-green font-bold">
                      {apiPlayerStats.championStats.win_rate_pct}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>KDA:</span>
                    <span className="text-neon-green font-bold">
                      {((apiPlayerStats.championStats.avg_kills + apiPlayerStats.championStats.avg_assists) / Math.max(apiPlayerStats.championStats.avg_deaths, 0.1)).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>CS Diff @15:</span>
                    <span className={`font-bold ${apiPlayerStats.championStats.avg_cs_diff_at_15 > 0 ? 'text-green-400' : apiPlayerStats.championStats.avg_cs_diff_at_15 < 0 ? 'text-red-400' : ''}`}>
                      {apiPlayerStats.championStats.avg_cs_diff_at_15 > 0 ? '+' : ''}{apiPlayerStats.championStats.avg_cs_diff_at_15.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gold Diff @15:</span>
                    <span className={`font-bold ${apiPlayerStats.championStats.avg_gold_diff_at_15 > 0 ? 'text-green-400' : apiPlayerStats.championStats.avg_gold_diff_at_15 < 0 ? 'text-red-400' : ''}`}>
                      {apiPlayerStats.championStats.avg_gold_diff_at_15 > 0 ? '+' : ''}{apiPlayerStats.championStats.avg_gold_diff_at_15.toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="performance" className="space-y-4 mt-4">
            {apiPlayerStats && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Kill Participation</span>
                  <div className="flex items-center gap-2">
                    {getPerformanceIcon(apiPlayerStats.avg_kp_pct, 60)}
                    <span className={`text-sm font-bold ${getPerformanceColor(apiPlayerStats.avg_kp_pct, 60)}`}>
                      {apiPlayerStats.avg_kp_pct.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Damage Share</span>
                  <div className="flex items-center gap-2">
                    {getPerformanceIcon(apiPlayerStats.avg_damage_share_pct, 25)}
                    <span className={`text-sm font-bold ${getPerformanceColor(apiPlayerStats.avg_damage_share_pct, 25)}`}>
                      {apiPlayerStats.avg_damage_share_pct.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Vision Score</span>
                  <div className="flex items-center gap-2">
                    {getPerformanceIcon(apiPlayerStats.avg_vision_score, 30)}
                    <span className={`text-sm font-bold ${getPerformanceColor(apiPlayerStats.avg_vision_score, 30)}`}>
                      {apiPlayerStats.avg_vision_score.toFixed(1)}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-neon-green mb-2">Lane Performance</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Gold @15:</span>
                      <span className={`font-bold ${apiPlayerStats.avg_gold_diff_at_15 > 0 ? 'text-green-400' : apiPlayerStats.avg_gold_diff_at_15 < 0 ? 'text-red-400' : ''}`}>
                        {apiPlayerStats.avg_gold_diff_at_15 > 0 ? '+' : ''}{apiPlayerStats.avg_gold_diff_at_15.toFixed(0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>XP @15:</span>
                      <span className={`font-bold ${apiPlayerStats.avg_xp_diff_at_15 > 0 ? 'text-green-400' : apiPlayerStats.avg_xp_diff_at_15 < 0 ? 'text-red-400' : ''}`}>
                        {apiPlayerStats.avg_xp_diff_at_15 > 0 ? '+' : ''}{apiPlayerStats.avg_xp_diff_at_15.toFixed(0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>CS @15:</span>
                      <span className={`font-bold ${apiPlayerStats.avg_cs_diff_at_15 > 0 ? 'text-green-400' : apiPlayerStats.avg_cs_diff_at_15 < 0 ? 'text-red-400' : ''}`}>
                        {apiPlayerStats.avg_cs_diff_at_15 > 0 ? '+' : ''}{apiPlayerStats.avg_cs_diff_at_15.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="objectives" className="space-y-4 mt-4">
            {teamStats && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">First Blood Rate</span>
                  <Badge variant="outline" className="text-neon-green border-neon-green/50">
                    {teamStats.first_blood_rate_pct.toFixed(1)}%
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Dragons per Game</span>
                  <span className="text-neon-green font-bold">{teamStats.avg_dragons.toFixed(1)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Barons per Game</span>
                  <span className="text-neon-green font-bold">{teamStats.avg_barons.toFixed(1)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Towers per Game</span>
                  <span className="text-neon-green font-bold">{teamStats.avg_towers.toFixed(1)}</span>
                </div>

                {teamStats.leagueRank && (
                  <div className="mt-4 p-3 bg-black/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">League Rank</span>
                      <Badge variant="outline" className="text-neon-green border-neon-green/50">
                        #{teamStats.leagueRank}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-muted-foreground">Team Strength</span>
                      <Badge variant={
                        teamStats.winRateComparison === 'above_average' ? 'default' :
                        teamStats.winRateComparison === 'average' ? 'secondary' : 'destructive'
                      }>
                        {teamStats.winRateComparison?.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
