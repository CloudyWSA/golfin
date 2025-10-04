"use client"

import type React from "react"
import { useEffect, useState, useMemo } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { X, Sword, Coins, Puzzle } from "lucide-react"
import { dataDragonService } from "@/services/data-dragon"
import { useMatchStore } from "@/store/match-store"
import type { ParticipantDetailed } from "@/types" 
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"


const SectionCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode; className?: string }> = ({
  icon,
  title,
  children,
  className = "",
}) => (
  <div
    className={`bg-black/20 border border-zinc-800 rounded-xl p-4 flex flex-col gap-4 backdrop-blur-sm ${className}`}
  >
    <div className="flex items-center gap-3">
      <div className="text-green-400">{icon}</div>
      <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300">{title}</h3>
    </div>
    {children}
  </div>
)

const MetricBar: React.FC<{ label: string; value: string; percentage: number; highlightColor: string }> = ({
  label,
  value,
  percentage,
  highlightColor,
}) => (
  <div className="space-y-2">
    <div className="flex justify-between items-baseline text-sm">
      <span className="text-zinc-400">{label}</span>
      <span className="font-medium text-zinc-100">
        {value}{" "}
        <span className={`font-bold ${highlightColor}`}>
          ({percentage.toFixed(1)}%)
        </span>
      </span>
    </div>
    <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${highlightColor.replace("text-", "bg-")}`}
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </div>
  </div>
)

const StatBox: React.FC<{ label: string; value: string | number; valueColor?: string }> = ({
  label,
  value,
  valueColor = "text-green-400",
}) => (
  <div className="bg-zinc-900 p-3 rounded-lg flex-1 text-center">
    <div className="text-xs text-zinc-400 mb-1 uppercase tracking-wider">{label}</div>
    <div className={`text-xl font-bold ${valueColor}`}>{value}</div>
  </div>
)


export function ChampionDetailsPanel({ onClose }: { onClose: () => void }) {
  const [championIcon, setChampionIcon] = useState<string | null>(null)
  const [itemData, setItemData] = useState<Map<number, { name: string; url: string }>>(new Map())

  const currentFrame = useMatchStore((state) => state.currentFrame)
  const selectedParticipant = useMatchStore((state) => state.selectedParticipant)

  const liveParticipantData = useMemo<ParticipantDetailed | null>(() => {
    if (!selectedParticipant) return null
    if (!currentFrame?.snapshot) {
      return selectedParticipant
    }
    const participantInFrame = currentFrame.snapshot.participants.find(
      (p) => p.participantId === selectedParticipant.participantId,
    )
    return participantInFrame || selectedParticipant
  }, [currentFrame, selectedParticipant])

  const teamMetrics = useMemo(() => {
    if (!currentFrame?.snapshot || !liveParticipantData) return { teamTotalDamage: 0, teamTotalGold: 0 }
    const teamParticipants = currentFrame.snapshot.participants.filter((p) => p.teamId === liveParticipantData.teamId)
    const teamTotalDamage = teamParticipants.reduce((sum, p) => sum + (p.totalDamageDealt || 0), 0)
    const teamTotalGold = teamParticipants.reduce((sum, p) => sum + (p.totalGold || 0), 0)
    return { teamTotalDamage, teamTotalGold }
  }, [currentFrame, liveParticipantData])

  if (!liveParticipantData) {
    return null
  }
  
  const damageShare =
    teamMetrics.teamTotalDamage > 0
      ? ((liveParticipantData.totalDamageDealt || 0) / teamMetrics.teamTotalDamage) * 100
      : 0
  const goldShare =
    teamMetrics.teamTotalGold > 0 ? ((liveParticipantData.totalGold || 0) / teamMetrics.teamTotalGold) * 100 : 0

  const currentTimeInMinutes = (currentFrame?.timestamp || 1) / 60
  const dpm = Math.round((liveParticipantData.totalDamageDealt || 0) / (currentTimeInMinutes || 1))
  const gpm = Math.round((liveParticipantData.totalGold || 0) / (currentTimeInMinutes || 1))

  useEffect(() => {
    if (liveParticipantData.championName) {
      dataDragonService.getChampionIconUrl(liveParticipantData.championName).then(setChampionIcon)
    }
  }, [liveParticipantData.championName])
  
  useEffect(() => {
    if (!liveParticipantData.items) return
    liveParticipantData.items.forEach((item) => {
      if (item.itemId > 0 && !itemData.has(item.itemId)) {
        Promise.all([
          dataDragonService.getItemData(item.itemId),
          dataDragonService.getItemIconUrl(item.itemId),
        ]).then(([data, url]) => {
          if (data) {
            setItemData((prevData) => {
              if (prevData.has(item.itemId)) return prevData 
              const newData = new Map(prevData)
              newData.set(item.itemId, { name: data.name, url })
              return newData
            })
          }
        })
      }
    })
  }, [liveParticipantData.items, itemData])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 flex flex-col h-full"
      >
        <div className="flex-shrink-0 p-4 border-b border-zinc-700 -m-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {championIcon && (
                <div className="relative w-16 h-16 rounded-lg ring-2 ring-green-400/50 flex-shrink-0">
                  <Image src={championIcon} alt={liveParticipantData.championName} fill className="object-cover rounded-lg" />
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-zinc-100">{liveParticipantData.summonerName}</h2>
                <p className="font-medium text-green-400">{liveParticipantData.championName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SectionCard icon={<Sword size={20} />} title="Combat">
              <MetricBar
                label="Damage Share"
                value={Math.round(liveParticipantData.totalDamageDealt || 0).toLocaleString()}
                percentage={damageShare}
                highlightColor="text-red-400"
              />
              <div className="flex gap-4">
                <StatBox label="DPM" value={dpm.toLocaleString()} />
                <StatBox
                  label="Damage Taken"
                  value={Math.round(liveParticipantData.totalDamageTaken || 0).toLocaleString()}
                  valueColor="text-zinc-100"
                />
              </div>
            </SectionCard>

            <SectionCard icon={<Coins size={20} />} title="Economy">
              <MetricBar
                label="Gold Share"
                value={liveParticipantData.totalGold.toLocaleString()}
                percentage={goldShare}
                highlightColor="text-yellow-400"
              />
              <div className="flex gap-4">
                <StatBox label="GPM" value={gpm.toLocaleString()} />
                <StatBox
                  label="Current Gold"
                  value={liveParticipantData.currentGold.toLocaleString()}
                  valueColor="text-zinc-100"
                />
              </div>
            </SectionCard>

            <SectionCard icon={<Puzzle size={20} />} title="Items & Key Stats" className="md:col-span-2">
              <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 items-start">
                <TooltipProvider delayDuration={100}>
                  <div className="grid grid-cols-4 gap-3">
                    {liveParticipantData.items &&
                      liveParticipantData.items.map((item) => {
                        const data = itemData.get(item.itemId)
                        return (
                          <Tooltip key={`${item.slot}-${item.itemId}`}>
                            <TooltipTrigger asChild>
                              <div className="relative aspect-square rounded-lg border-2 border-zinc-700 bg-zinc-900 overflow-hidden hover:border-green-400 transition-colors group">
                                {data?.url && <Image src={data.url} alt={data.name} fill className="object-cover" />}
                                {item.stacks && item.stacks > 1 && (
                                  <span className="absolute bottom-0 right-1 text-xs font-bold text-white [text-shadow:0_0_4px_#000]">
                                    {item.stacks}
                                  </span>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-zinc-900 border-zinc-700 text-zinc-100">
                              <p className="font-bold">{data?.name || `Item ${item.itemId}`}</p>
                            </TooltipContent>
                          </Tooltip>
                        )
                      })}
                  </div>
                </TooltipProvider>

                <div className="flex flex-col gap-3">
                  <StatBox
                    label="KDA"
                    value={`${liveParticipantData.kills}/${liveParticipantData.deaths}/${liveParticipantData.assists}`}
                    valueColor="text-zinc-100"
                  />
                  <StatBox label="Level" value={liveParticipantData.level} valueColor="text-zinc-100" />
                  <StatBox 
                    label="Vision Score" 
                    value={(liveParticipantData.visionScore || 0).toFixed(1)} 
                    valueColor="text-zinc-100"
                  />
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}