import { create } from "zustand"
import type {
  MatchData,
  TimelineFrame,
  PlayerCareerStats,
  PlayerNotification,
  DominanceMap,
  ParticipantDetailed,
} from "@/types"
import type { PlayerStatsWithChampion, TeamComparisonStats } from "@/types/cloudylol-api"

interface MatchState {
  matchData: MatchData | null
  careerStats: PlayerCareerStats[]
  currentFrame: TimelineFrame | null
  dominanceMap: DominanceMap | null
  notifications: PlayerNotification[]
  selectedParticipant: ParticipantDetailed | null

  apiPlayerStats: Map<string, PlayerStatsWithChampion>
  apiTeamStats: Map<string, TeamComparisonStats>
  apiLoadingStates: Map<string, boolean>
  apiErrors: Map<string, string | null>

  currentTime: number
  isPlaying: boolean
  playbackSpeed: number

  isLoading: boolean
  loadingProgress: number
  error: string | null

  setMatchData: (data: MatchData) => void
  setCareerStats: (stats: PlayerCareerStats[]) => void
  setCurrentFrame: (frame: TimelineFrame) => void
  setDominanceMap: (map: DominanceMap) => void
  addNotification: (notification: PlayerNotification) => void
  clearNotifications: () => void

  setCurrentTime: (time: number) => void
  setIsPlaying: (playing: boolean) => void
  setPlaybackSpeed: (speed: number) => void

  setLoading: (loading: boolean) => void
  setLoadingProgress: (progress: number) => void
  setError: (error: string | null) => void

  selectParticipant: (participant: ParticipantDetailed) => void
  clearSelectedParticipant: () => void

  setApiPlayerStats: (playerName: string, championName: string | undefined, stats: PlayerStatsWithChampion) => void
  setApiTeamStats: (teamName: string, stats: TeamComparisonStats) => void
  setApiLoadingState: (key: string, loading: boolean) => void
  setApiError: (key: string, error: string | null) => void
  clearApiData: () => void

  reset: () => void
}

export const useMatchStore = create<MatchState>((set) => ({
  matchData: null,
  careerStats: [],
  currentFrame: null,
  dominanceMap: null,
  notifications: [],
  selectedParticipant: null,

  apiPlayerStats: new Map(),
  apiTeamStats: new Map(),
  apiLoadingStates: new Map(),
  apiErrors: new Map(),

  currentTime: 0,
  isPlaying: false,
  playbackSpeed: 1,

  isLoading: false,
  loadingProgress: 0,
  error: null,

  setMatchData: (data) => {
    set({ matchData: data })
  },
  setCareerStats: (stats) => set({ careerStats: stats }),
  setCurrentFrame: (frame) => {
    set({ currentFrame: frame })
  },
  setDominanceMap: (map) => set({ dominanceMap: map }),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [...state.notifications, notification].slice(-50),
    })),
  clearNotifications: () => set({ notifications: [] }),

  setCurrentTime: (time) => {
    set({ currentTime: time })
  },
  setIsPlaying: (playing) => {
    set({ isPlaying: playing })
  },
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

  setLoading: (loading) => set({ isLoading: loading }),
  setLoadingProgress: (progress) => set({ loadingProgress: progress }),
  setError: (error) => set({ error }),

  selectParticipant: (participant) => set({ selectedParticipant: participant }),
  clearSelectedParticipant: () => set({ selectedParticipant: null }),

  setApiPlayerStats: (playerName, championName, stats) =>
    set((state) => {
      const newMap = new Map(state.apiPlayerStats)
      newMap.set(`${playerName.toLowerCase()}-${championName || 'general'}`, stats)
      return { apiPlayerStats: newMap }
    }),
  setApiTeamStats: (teamName, stats) =>
    set((state) => {
      const newMap = new Map(state.apiTeamStats)
      newMap.set(teamName.toLowerCase(), stats)
      return { apiTeamStats: newMap }
    }),
  setApiLoadingState: (key, loading) =>
    set((state) => {
      const newMap = new Map(state.apiLoadingStates)
      newMap.set(key, loading)
      return { apiLoadingStates: newMap }
    }),
  setApiError: (key, error) =>
    set((state) => {
      const newMap = new Map(state.apiErrors)
      newMap.set(key, error)
      return { apiErrors: newMap }
    }),
  clearApiData: () =>
    set({
      apiPlayerStats: new Map(),
      apiTeamStats: new Map(),
      apiLoadingStates: new Map(),
      apiErrors: new Map(),
    }),

  reset: () =>
    set({
      matchData: null,
      careerStats: [],
      currentFrame: null,
      dominanceMap: null,
      notifications: [],
      selectedParticipant: null,
      apiPlayerStats: new Map(),
      apiTeamStats: new Map(),
      apiLoadingStates: new Map(),
      apiErrors: new Map(),
      currentTime: 0,
      isPlaying: false,
      playbackSpeed: 1,
      isLoading: false,
      loadingProgress: 0,
      error: null,
    }),
}))