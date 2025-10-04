"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, TrendingDown, Crown, Target, Shield, Coins, Timer, Zap, Eye } from "lucide-react"
import type { TeamComparisonStats } from "@/types/cloudylol-api"

interface TeamStatsPanelProps {
  teamStats: TeamComparisonStats
  leagueAverage?: TeamComparisonStats
  className?: string
}

export function TeamStatsPanel({ teamStats, leagueAverage, className }: TeamStatsPanelProps) {
  const getComparisonColor = (teamValue: number, avgValue: number) => {
    if (teamValue > avgValue * 1.1) return "text-green-400"
    if (teamValue < avgValue * 0.9) return "text-red-400"
    return "text-muted-foreground"
  }

  const getComparisonIcon = (teamValue: number, avgValue: number) => {
    if (teamValue > avgValue * 1.1) return <TrendingUp className="h-3 w-3 text-green-400" />
    if (teamValue < avgValue * 0.9) return <TrendingDown className="h-3 w-3 text-red-400" />
    return null
  }

  const getStrengthBadge = (strength: string) => {
    switch (strength) {
      case 'strong':
        return <Badge className="bg-green-500/20 text-green-400 border-green-400/50">Strong</Badge>
      case 'weak':
        return <Badge className="bg-red-500/20 text-red-400 border-red-400/50">Weak</Badge>
      default:
        return <Badge variant="secondary">Average</Badge>
    }
  }

  const getObjectiveBadge = (control: string) => {
    switch (control) {
      case 'excellent':
        return <Badge className="bg-green-500/20 text-green-400 border-green-400/50">Excellent</Badge>
      case 'good':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-400/50">Good</Badge>
      case 'poor':
        return <Badge className="bg-red-500/20 text-red-400 border-red-400/50">Poor</Badge>
      default:
        return <Badge variant="secondary">Average</Badge>
    }
  }

  return (
    <Card className={`${className} bg-black/50 border-neon-green/20`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-neon-green">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            {teamStats.teamname}
          </div>
          <div className="flex items-center gap-2">
            {teamStats.leagueRank && (
              <Badge variant="outline" className="text-neon-green border-neon-green/50">
                #{teamStats.leagueRank}
              </Badge>
            )}
            <Badge variant="outline" className="text-neon-green border-neon-green/50">
              {teamStats.win_rate_pct}% WR
            </Badge>
          </div>
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <span>{teamStats.games_played} Games Played</span>
          <span>•</span>
          <span>{teamStats.wins}W - {teamStats.losses}L</span>
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-black/30">
            <TabsTrigger value="overview" className="text-xs data-[state=active]:bg-neon-green/20 data-[state=active]:text-neon-green">
              Overview
            </TabsTrigger>
            <TabsTrigger value="objectives" className="text-xs data-[state=active]:bg-neon-green/20 data-[state=active]:text-neon-green">
              Objectives
            </TabsTrigger>
            <TabsTrigger value="comparison" className="text-xs data-[state=active]:bg-neon-green/20 data-[state=active]:text-neon-green">
              League
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Win Rate</span>
                  <div className="flex items-center gap-2">
                    {leagueAverage && getComparisonIcon(teamStats.win_rate_pct, leagueAverage.win_rate_pct)}
                    <span className={`font-bold ${leagueAverage ? getComparisonColor(teamStats.win_rate_pct, leagueAverage.win_rate_pct) : 'text-neon-green'}`}>
                      {teamStats.win_rate_pct}%
                    </span>
                  </div>
                </div>
                <Progress
                  value={teamStats.win_rate_pct}
                  className="h-2 bg-black/30"
                />

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Game Length</span>
                  <div className="flex items-center gap-2">
                    <Timer className="h-3 w-3" />
                    <span className="text-sm">{teamStats.avg_game_length_mins.toFixed(1)}min</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Team Kills</span>
                  <div className="flex items-center gap-2">
                    {leagueAverage && getComparisonIcon(teamStats.avg_team_kills, leagueAverage.avg_team_kills)}
                    <span className={`font-bold ${leagueAverage ? getComparisonColor(teamStats.avg_team_kills, leagueAverage.avg_team_kills) : 'text-neon-green'}`}>
                      {teamStats.avg_team_kills.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">First Blood</span>
                  <Badge variant="outline" className="text-neon-green border-neon-green/50">
                    {teamStats.first_blood_rate_pct.toFixed(1)}%
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">First Tower</span>
                  <Badge variant="outline" className="text-neon-green border-neon-green/50">
                    {teamStats.first_tower_rate_pct.toFixed(1)}%
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">First Dragon</span>
                  <Badge variant="outline" className="text-neon-green border-neon-green/50">
                    {teamStats.first_dragon_rate_pct.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-neon-green/10 rounded-lg border border-neon-green/20">
              <h4 className="text-sm font-semibold text-neon-green mb-2">Champion Pool</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span>Top:</span>
                  <Badge variant="outline" className="text-xs">{teamStats.most_played_top}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Jungle:</span>
                  <Badge variant="outline" className="text-xs">{teamStats.most_played_jng}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Mid:</span>
                  <Badge variant="outline" className="text-xs">{teamStats.most_played_mid}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>ADC:</span>
                  <Badge variant="outline" className="text-xs">{teamStats.most_played_bot}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Support:</span>
                  <Badge variant="outline" className="text-xs">{teamStats.most_played_sup}</Badge>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="objectives" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Dragons</span>
                  <div className="flex items-center gap-2">
                    {leagueAverage && getComparisonIcon(teamStats.avg_dragons, leagueAverage.avg_dragons)}
                    <span className={`font-bold ${leagueAverage ? getComparisonColor(teamStats.avg_dragons, leagueAverage.avg_dragons) : 'text-neon-green'}`}>
                      {teamStats.avg_dragons.toFixed(1)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Barons</span>
                  <div className="flex items-center gap-2">
                    {leagueAverage && getComparisonIcon(teamStats.avg_barons, leagueAverage.avg_barons)}
                    <span className={`font-bold ${leagueAverage ? getComparisonColor(teamStats.avg_barons, leagueAverage.avg_barons) : 'text-neon-green'}`}>
                      {teamStats.avg_barons.toFixed(1)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Heralds</span>
                  <div className="flex items-center gap-2">
                    {leagueAverage && getComparisonIcon(teamStats.avg_heralds, leagueAverage.avg_heralds)}
                    <span className={`font-bold ${leagueAverage ? getComparisonColor(teamStats.avg_heralds, leagueAverage.avg_heralds) : 'text-neon-green'}`}>
                      {teamStats.avg_heralds.toFixed(1)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Towers</span>
                  <div className="flex items-center gap-2">
                    {leagueAverage && getComparisonIcon(teamStats.avg_towers, leagueAverage.avg_towers)}
                    <span className={`font-bold ${leagueAverage ? getComparisonColor(teamStats.avg_towers, leagueAverage.avg_towers) : 'text-neon-green'}`}>
                      {teamStats.avg_towers.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Ward Rate</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{teamStats.avg_wpm.toFixed(1)}/min</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Vision Score</span>
                  <div className="flex items-center gap-2">
                    <Eye className="h-3 w-3" />
                    <span className="text-sm">{teamStats.avg_vspm.toFixed(1)}/min</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Control Wards</span>
                  <div className="flex items-center gap-2">
                    <Shield className="h-3 w-3" />
                    <span className="text-sm">{teamStats.avg_wcpm.toFixed(1)}/min</span>
                  </div>
                </div>
              </div>
            </div>

            {teamStats.objectiveControl && (
              <div className="mt-4 p-3 bg-black/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-neon-green">Objective Control</span>
                  {getObjectiveBadge(teamStats.objectiveControl)}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="comparison" className="space-y-4 mt-4">
            {leagueAverage && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Win Rate vs League Avg</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${getComparisonColor(teamStats.win_rate_pct, leagueAverage.win_rate_pct)}`}>
                      {teamStats.win_rate_pct > leagueAverage.win_rate_pct ? '+' : ''}
                      {(teamStats.win_rate_pct - leagueAverage.win_rate_pct).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Early Game (Gold@15)</span>
                  <div className="flex items-center gap-2">
                    {getComparisonIcon(teamStats.avg_gold_diff_at_15, leagueAverage.avg_gold_diff_at_15)}
                    <span className={`font-bold ${getComparisonColor(teamStats.avg_gold_diff_at_15, leagueAverage.avg_gold_diff_at_15)}`}>
                      {teamStats.avg_gold_diff_at_15 > leagueAverage.avg_gold_diff_at_15 ? '+' : ''}
                      {teamStats.avg_gold_diff_at_15 - leagueAverage.avg_gold_diff_at_15 > 0 ? '+' : ''}
                      {(teamStats.avg_gold_diff_at_15 - leagueAverage.avg_gold_diff_at_15).toFixed(0)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Objectives</span>
                  <div className="flex items-center gap-2">
                    {getComparisonIcon(teamStats.avg_dragons + teamStats.avg_barons, leagueAverage.avg_dragons + leagueAverage.avg_barons)}
                    <span className={`font-bold ${getComparisonColor(teamStats.avg_dragons + teamStats.avg_barons, leagueAverage.avg_dragons + leagueAverage.avg_barons)}`}>
                      {((teamStats.avg_dragons + teamStats.avg_barons) - (leagueAverage.avg_dragons + leagueAverage.avg_barons)).toFixed(1)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-black/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-neon-green">Team Strength</span>
                    {teamStats.earlyGameStrength && getStrengthBadge(teamStats.earlyGameStrength)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-neon-green">Win Rate</span>
                    {teamStats.winRateComparison && (
                      <Badge variant={
                        teamStats.winRateComparison === 'above_average' ? 'default' :
                        teamStats.winRateComparison === 'average' ? 'secondary' : 'destructive'
                      }>
                        {teamStats.winRateComparison.replace('_', ' ')}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
