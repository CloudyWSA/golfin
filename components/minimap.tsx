"use client"

import { useMemo, useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { useMatchStore } from "@/store/match-store"
import { dataDragonService } from "@/services/data-dragon"
import type { Ward, KillEvent, ParticipantDetailed } from "@/types"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Eye, Diamond, Sword } from "lucide-react"

type Point = { x: number; y: number }
type NormalizedParticipant = ParticipantDetailed & { normalizedPosition: Point }

const TEAM_COLORS_RGB = {
  blue: "0, 170, 255",
  red: "255, 51, 51",
}
const TEAM_COLORS = {
  blue: "#00aaff",
  red: "#ff3333",
}

const MAP_BOUNDS = {
  minX: -170,
  maxX: 16220,
  minY: -1850,
  maxY: 14980,
}

const WARD_DISPLAY_NAMES: Record<Ward["wardType"], string> = {
  CONTROL_WARD: "Control Ward",
  YELLOW_TRINKET: "Stealth Ward",
  SIGHT_WARD: "Oracle Lens",
  BLUE_TRINKET: "Farsight Alteration",
}

const CHAMPION_INFLUENCE_RADIUS = 100
const WARD_INFLUENCE_RADIUS = 35
const CHAMPION_INFLUENCE_OPACITY = 0.15
const WARD_INFLUENCE_OPACITY = 0.08
const INVASION_PATH_JOIN_DISTANCE = 0.2
const INVASION_THRESHOLD = 1.0

function normalizePosition(position: { x: number; z: number }): Point {
  const rangeX = MAP_BOUNDS.maxX - MAP_BOUNDS.minX
  const rangeY = MAP_BOUNDS.maxY - MAP_BOUNDS.minY
  const x = Math.max(0, Math.min(1, (position.x - MAP_BOUNDS.minX) / rangeX))
  const y = 1 - Math.max(0, Math.min(1, (position.z - MAP_BOUNDS.minY) / rangeY))
  return { x, y }
}

function getDistanceSq(p1: Point, p2: Point): number {
  return (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2
}

function crossProduct(p1: Point, p2: Point, p3: Point): number {
  return (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x)
}

function getConvexHull(points: Point[]): Point[] {
  if (points.length <= 2) return points
  const sortedPoints = [...points].sort((a, b) => a.x - b.x || a.y - b.y)

  const lower: Point[] = []
  for (const point of sortedPoints) {
    while (lower.length >= 2 && crossProduct(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) {
      lower.pop()
    }
    lower.push(point)
  }

  const upper: Point[] = []
  for (let i = sortedPoints.length - 1; i >= 0; i--) {
    const point = sortedPoints[i]
    while (upper.length >= 2 && crossProduct(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) {
      upper.pop()
    }
    upper.push(point)
  }

  upper.pop()
  lower.pop()
  return lower.concat(upper)
}

function findChampionGroups(invaders: NormalizedParticipant[]): NormalizedParticipant[][] {
  if (invaders.length === 0) return []
  const adj: Map<number, number[]> = new Map()
  const groupRangeSq = INVASION_PATH_JOIN_DISTANCE ** 2

  for (let i = 0; i < invaders.length; i++) {
    adj.set(invaders[i].participantId, [])
    for (let j = i + 1; j < invaders.length; j++) {
      if (getDistanceSq(invaders[i].normalizedPosition, invaders[j].normalizedPosition) < groupRangeSq) {
        adj.get(invaders[i].participantId)?.push(invaders[j].participantId)
        adj.get(invaders[j].participantId)?.push(invaders[i].participantId)
      }
    }
  }

  const visited = new Set<number>()
  const groups: NormalizedParticipant[][] = []
  const participantMap = new Map(invaders.map((p) => [p.participantId, p]))

  function dfs(participantId: number, currentGroup: NormalizedParticipant[]) {
    visited.add(participantId)
    const participant = participantMap.get(participantId)
    if (participant) currentGroup.push(participant)
    const neighbors = adj.get(participantId) || []
    for (const neighborId of neighbors) {
      if (!visited.has(neighborId)) dfs(neighborId, currentGroup)
    }
  }

  for (const invader of invaders) {
    if (!visited.has(invader.participantId)) {
      const newGroup: NormalizedParticipant[] = []
      dfs(invader.participantId, newGroup)
      groups.push(newGroup)
    }
  }
  return groups
}

function getInvasionPolygons(invaders: NormalizedParticipant[], basePosition: Point, isBlueTeam: boolean): Point[][] {
  const groups = findChampionGroups(invaders)
  const allPolygons: Point[][] = []

  groups.forEach((group) => {
    const positions = group.map((p) => p.normalizedPosition)
    let pathPolygon: Point[] = []

    if (positions.length === 1) {
      const pos = positions[0]
      const vecToBase = { x: basePosition.x - pos.x, y: basePosition.y - pos.y }
      const perpVec = { x: -vecToBase.y, y: vecToBase.x }
      pathPolygon = [
        pos,
        { x: pos.x + vecToBase.x * 0.4 - perpVec.x * 0.35, y: pos.y + vecToBase.y * 0.4 - perpVec.y * 0.35 },
        { x: pos.x + vecToBase.x * 0.4 + perpVec.x * 0.35, y: pos.y + vecToBase.y * 0.4 + perpVec.y * 0.35 },
      ]
    } else if (positions.length > 1) {
      const hull = getConvexHull(positions)
      if (hull.length < 2) return

      let maxDistSq = 0
      let p1_idx = 0,
        p2_idx = 0
      for (let i = 0; i < hull.length; i++) {
        for (let j = i + 1; j < hull.length; j++) {
          const dSq = getDistanceSq(hull[i], hull[j])
          if (dSq > maxDistSq) {
            maxDistSq = dSq
            p1_idx = i
            p2_idx = j
          }
        }
      }

      let p1 = hull[p1_idx]
      let p2 = hull[p2_idx]
      const midPoint = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }
      if (
        (isBlueTeam && crossProduct(midPoint, p1, basePosition) < 0) ||
        (!isBlueTeam && crossProduct(midPoint, p1, basePosition) > 0)
      ) {
        ;[p1, p2] = [p2, p1]
      }

      const vecToBase1 = { x: basePosition.x - p1.x, y: basePosition.y - p1.y }
      const vecToBase2 = { x: basePosition.x - p2.x, y: basePosition.y - p2.y }
      const p3 = { x: p1.x + vecToBase1.x * 0.8, y: p1.y + vecToBase1.y * 0.8 }
      const p4 = { x: p2.x + vecToBase2.x * 0.8, y: p2.y + vecToBase2.y * 0.8 }
      pathPolygon = [p1, p2, p4, p3]
    }
    if (pathPolygon.length > 0) allPolygons.push(pathPolygon)
  })
  return allPolygons
}

export function Minimap() {
  const { selectedParticipant, selectParticipant, currentFrame, dominanceMap, currentTime } = useMatchStore()

  const participants = useMemo(
    () => (currentFrame?.snapshot?.participants.filter((p) => p.position) as ParticipantDetailed[]) || [],
    [currentFrame],
  )
  const wards = useMemo(() => currentFrame?.wards.filter((w) => w.position) || [], [currentFrame])
  const activeChannelings = useMemo(() => currentFrame?.activeChannelings || [], [currentFrame])
  const recentKills = useMemo(() => currentFrame?.recentKills || [], [currentFrame])

  const { staticTerritoryCanvas, dynamicElementsCanvas } = useMemo(() => {
    const size = 512
    const createCanvas = () => {
      const canvas = document.createElement("canvas")
      canvas.width = size
      canvas.height = size
      return { canvas, ctx: canvas.getContext("2d") }
    }

    const { canvas: staticCanvas, ctx: staticCtx } = createCanvas()
    if (staticCtx && dominanceMap?.influenceMap?.length) {
      dominanceMap.influenceMap.forEach((cell) => {
        const px = Math.floor(cell.x * size)
        const py = Math.floor(cell.y * size)
        const totalInfluence = cell.blue + cell.red
        if (totalInfluence > 0.05) {
          const blueRatio = cell.blue / totalInfluence
          const strength = Math.min(0.95, totalInfluence * 2.5)
          staticCtx.fillStyle = `rgba(${blueRatio > 0.5 ? TEAM_COLORS_RGB.blue : TEAM_COLORS_RGB.red}, ${strength})`
          staticCtx.fillRect(px, py, 2, 2)
        }
      })
      staticCtx.filter = "blur(3px)"
      staticCtx.drawImage(staticCanvas, 0, 0)
      staticCtx.filter = "none"
    }

    const { canvas: dynamicCanvas, ctx: dynamicCtx } = createCanvas()
    if (dynamicCtx) {
      dynamicCtx.globalCompositeOperation = "source-over"
      const normalizedParticipants: NormalizedParticipant[] = participants.map((p) => ({
        ...p,
        normalizedPosition: p.position ? normalizePosition(p.position) : { x: -1, y: -1 },
      }))

      const blueInvaders = normalizedParticipants.filter(
        (p) => p.teamId === 100 && p.normalizedPosition.x + p.normalizedPosition.y > INVASION_THRESHOLD,
      )
      const redInvaders = normalizedParticipants.filter(
        (p) => p.teamId === 200 && p.normalizedPosition.x + p.normalizedPosition.y < INVASION_THRESHOLD,
      )

      const blueInvasionPolygons = getInvasionPolygons(blueInvaders, { x: 0, y: 1 }, true)
      const redInvasionPolygons = getInvasionPolygons(redInvaders, { x: 1, y: 0 }, false)

      const drawInvasionArea = (polygons: Point[][]) => {
        if (polygons.length === 0) return
        polygons.forEach((poly) => {
          dynamicCtx.moveTo(poly[0].x * size, poly[0].y * size)
          for (let i = 1; i < poly.length; i++) {
            dynamicCtx.lineTo(poly[i].x * size, poly[i].y * size)
          }
          dynamicCtx.closePath()
        })
      }

      dynamicCtx.save()
      dynamicCtx.beginPath()
      drawInvasionArea(blueInvasionPolygons)
      drawInvasionArea(redInvasionPolygons)
      dynamicCtx.clip()
      dynamicCtx.drawImage(staticCanvas, 0, 0)
      dynamicCtx.restore()

      dynamicCtx.globalCompositeOperation = "lighter"
      const drawRadialInfluence = (
        entities: Array<{ position: { x: number; z: number }; teamId: number }>,
        teamColor: string,
        radius: number,
        opacity: number,
      ) => {
        entities.forEach((entity) => {
          if (!entity.position) return
          const normPos = normalizePosition(entity.position)
          const px = normPos.x * size
          const py = normPos.y * size
          const gradient = dynamicCtx.createRadialGradient(px, py, 0, px, py, radius)
          gradient.addColorStop(0, `rgba(${teamColor}, ${opacity})`)
          gradient.addColorStop(1, `rgba(${teamColor}, 0)`)
          dynamicCtx.fillStyle = gradient
          dynamicCtx.beginPath()
          dynamicCtx.arc(px, py, radius, 0, 2 * Math.PI)
          dynamicCtx.fill()
        })
      }
      drawRadialInfluence(
        participants.filter((p) => p.teamId === 100),
        TEAM_COLORS_RGB.blue,
        CHAMPION_INFLUENCE_RADIUS,
        CHAMPION_INFLUENCE_OPACITY,
      )
      drawRadialInfluence(
        wards.filter((w) => w.teamId === 100),
        TEAM_COLORS_RGB.blue,
        WARD_INFLUENCE_RADIUS,
        WARD_INFLUENCE_OPACITY,
      )
      drawRadialInfluence(
        participants.filter((p) => p.teamId === 200),
        TEAM_COLORS_RGB.red,
        CHAMPION_INFLUENCE_RADIUS,
        CHAMPION_INFLUENCE_OPACITY,
      )
      drawRadialInfluence(
        wards.filter((w) => w.teamId === 200),
        TEAM_COLORS_RGB.red,
        WARD_INFLUENCE_RADIUS,
        WARD_INFLUENCE_OPACITY,
      )

      dynamicCtx.filter = "blur(20px)"
      dynamicCtx.drawImage(dynamicCanvas, 0, 0)
      dynamicCtx.filter = "none"
    }

    return {
      staticTerritoryCanvas: staticCanvas.toDataURL(),
      dynamicElementsCanvas: dynamicCanvas.toDataURL(),
    }
  }, [dominanceMap, participants, wards])

  return (
    <TooltipProvider delayDuration={150}>
      <div className="relative w-full aspect-square bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden shadow-lg">
        <Image src="/minimap.png" alt="League of Legends Map" fill className="object-cover" priority />
        {staticTerritoryCanvas && (
          <div className="absolute inset-0 opacity-95 mix-blend-lighten">
            <Image src={staticTerritoryCanvas} alt="Territory Control" fill className="object-cover" />
          </div>
        )}
        {dynamicElementsCanvas && (
          <div className="absolute inset-0 opacity-100 mix-blend-lighten">
            <Image src={dynamicElementsCanvas} alt="Dynamic Elements" fill className="object-cover" />
          </div>
        )}
        <div className="absolute inset-0 pointer-events-none">
          <AnimatePresence>
            {wards.map((ward) => (
              <WardMarker key={ward.wardId} ward={ward} currentTime={currentTime} />
            ))}
          </AnimatePresence>
          {participants.map((participant) => {
            const isChanneling = activeChannelings.some((c) => c.participantId === participant.participantId)
            return (
              <ChampionMarker
                key={participant.participantId}
                participant={participant}
                isChanneling={isChanneling}
                isSelected={selectedParticipant?.participantId === participant.participantId}
                onClick={() => selectParticipant(participant)}
              />
            )
          })}
          <AnimatePresence>
            {recentKills.map((kill, index) => (
              <KillMarker key={`kill-${kill.gameTime}-${index}`} kill={kill} participants={participants} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </TooltipProvider>
  )
}

function ChampionMarker({
  participant,
  isChanneling,
  isSelected,
  onClick,
}: {
  participant: ParticipantDetailed
  isChanneling: boolean
  isSelected: boolean
  onClick?: () => void
}) {
  const [iconUrl, setIconUrl] = useState<string | null>(null)
  useEffect(() => {
    dataDragonService.getChampionIconUrl(participant.championName).then(setIconUrl)
  }, [participant.championName])

  if (!participant.position) return null
  const normalized = normalizePosition(participant.position)
  const borderColor = participant.teamId === 100 ? TEAM_COLORS.blue : TEAM_COLORS.red

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          className="absolute pointer-events-auto cursor-pointer transition-transform duration-200"
          style={{
            left: `${normalized.x * 100}%`,
            top: `${normalized.y * 100}%`,
            transform: "translate(-50%, -50%)",
            zIndex: 20,
          }}
          animate={{ scale: isSelected ? 1.25 : 1 }}
          whileHover={{ scale: isSelected ? 1.35 : 1.15 }}
          onClick={onClick}
        >
          <div className="relative">
            {isChanneling && (
              <motion.div
                className="absolute -inset-1 rounded-full border-2 border-dashed border-teal-300"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              />
            )}
            <div
              className={`relative w-7 h-7 rounded-full border-2 overflow-hidden transition-all duration-200 ${
                isSelected ? "ring-2 ring-offset-2 ring-offset-zinc-900 ring-yellow-300" : ""
              }`}
              style={{
                borderColor,
                boxShadow: `0 0 12px 3px ${borderColor}`,
              }}
            >
              {iconUrl && <Image src={iconUrl} alt={participant.championName} fill className="object-cover" />}
            </div>
          </div>
        </motion.div>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="font-bold">{participant.summonerName}</p>
        <p className="text-sm text-zinc-400">{participant.championName}</p>
      </TooltipContent>
    </Tooltip>
  )
}

function WardMarker({ ward, currentTime }: { ward: Ward; currentTime: number }) {
  if (!ward.position) return null

  const normalized = normalizePosition(ward.position)
  const wardName = WARD_DISPLAY_NAMES[ward.wardType] || "Ward"
  const WardIcon = ward.wardType === "CONTROL_WARD" ? Diamond : Eye
  const teamColor = ward.teamId === 100 ? TEAM_COLORS.blue : TEAM_COLORS.red
  const hasFiniteDuration = ward.expiresAt !== Number.POSITIVE_INFINITY

  const timerProps = useMemo(() => {
    if (!hasFiniteDuration) return null

    const totalDuration = ward.expiresAt - ward.placedAt
    if (totalDuration <= 0) return null

    const timeElapsed = currentTime - ward.placedAt
    const percentageRemaining = 1 - Math.max(0, Math.min(1, timeElapsed / totalDuration))
    const radius = 10
    const circumference = 2 * Math.PI * radius

    return {
      radius,
      circumference,
      strokeDashoffset: circumference * (1 - percentageRemaining),
    }
  }, [ward.placedAt, ward.expiresAt, currentTime, hasFiniteDuration])

  const remainingSeconds = Math.max(0, ward.expiresAt - currentTime)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="absolute pointer-events-auto"
          style={{
            left: `${normalized.x * 100}%`,
            top: `${normalized.y * 100}%`,
            transform: "translate(-50%, -50%)",
            zIndex: 10,
          }}
        >
          <div className="relative w-8 h-8 flex items-center justify-center">
            {timerProps && (
              <svg className="absolute w-full h-full" viewBox="0 0 24 24">
                <circle
                  cx="12"
                  cy="12"
                  r={timerProps.radius}
                  fill="transparent"
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth="2"
                />
                <circle
                  cx="12"
                  cy="12"
                  r={timerProps.radius}
                  fill="transparent"
                  stroke={teamColor}
                  strokeWidth="2"
                  strokeLinecap="round"
                  transform="rotate(-90 12 12)"
                  style={{
                    strokeDasharray: timerProps.circumference,
                    strokeDashoffset: timerProps.strokeDashoffset,
                    transition: "stroke-dashoffset 0.2s linear",
                  }}
                />
              </svg>
            )}
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{
                border: `2px solid ${teamColor}`,
                backgroundColor: `${teamColor}60`,
                boxShadow: `0 0 10px 2px ${teamColor}`,
              }}
            >
              <WardIcon className="w-2.5 h-2.5 text-white" />
            </div>
          </div>
        </motion.div>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="font-semibold">{wardName}</p>
        {hasFiniteDuration && <p className="text-sm text-zinc-400">Expires in {remainingSeconds.toFixed(0)}s</p>}
      </TooltipContent>
    </Tooltip>
  )
}

function KillMarker({ kill, participants }: { kill: KillEvent; participants: ParticipantDetailed[] }) {
  if (!kill.position) return null
  const normalized = normalizePosition(kill.position)
  const killer = participants.find((p) => p.participantId === kill.killerId)
  const killerColor = killer?.teamId === 100 ? TEAM_COLORS.blue : TEAM_COLORS.red

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 1 }}
      animate={{ scale: 2.5, opacity: 0 }}
      transition={{ duration: 1.5, ease: "easeOut" }}
      className="absolute pointer-events-none"
      style={{
        left: `${normalized.x * 100}%`,
        top: `${normalized.y * 100}%`,
        transform: "translate(-50%, -50%)",
        zIndex: 30,
      }}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center"
        style={{
          border: `3px solid ${killerColor}`,
          backgroundColor: `${killerColor}99`,
          boxShadow: `0 0 15px 4px ${killerColor}`,
        }}
      >
        <Sword className="w-4 h-4 text-white" />
      </div>
    </motion.div>
  )
}