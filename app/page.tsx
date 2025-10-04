"use client"

import { useMatchStore } from "@/store/match-store"
import { useTimelineSync } from "@/hooks/use-timeline-sync"
import { useApiDataLoader } from "@/hooks/use-api-data-loader"
import { FileUploader } from "@/components/file-uploader"
import { VideoPlayer } from "@/components/video-player"
import { Minimap } from "@/components/minimap"
import { TimelineScrubber } from "@/components/timeline-scrubber"
import { ChampionDetailsPanel } from "@/components/champion-details-panel"
import { MatchNotifications } from "@/components/match-notifications"
import { NotificationTestButton } from "@/components/notification-test-button"
import { BarChart3, Map, Video, UploadCloud, UserSearch } from "lucide-react"

const PlayerDetailsContent = ChampionDetailsPanel

const DashboardModule: React.FC<{
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  className?: string
}> = ({ title, icon, children, className = "" }) => (
  <div
    className={`bg-black/30 border border-zinc-800 rounded-xl flex flex-col backdrop-blur-sm overflow-hidden ${className}`}
  >
    <div className="flex items-center gap-3 p-4 border-b border-zinc-800 flex-shrink-0">
      <div className="text-green-400">{icon}</div>
      <h2 className="font-bold text-zinc-200 tracking-wide">{title}</h2>
    </div>
    <div className="p-4 flex-1 overflow-y-auto relative">{children}</div>
  </div>
)

export default function Home() {
  const matchData = useMatchStore((state) => state.matchData)
  const error = useMatchStore((state) => state.error)
  const selectedParticipant = useMatchStore((state) => state.selectedParticipant)
  const clearSelectedParticipant = useMatchStore((state) => state.clearSelectedParticipant)

  useTimelineSync()
  useApiDataLoader()

  const renderDashboard = () => (
    <div className="flex flex-col h-full gap-6">
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-[1fr_2fr_1.5fr] gap-6 overflow-hidden">
        <DashboardModule title="Minimap" icon={<Map size={20} />} className="flex-1">
          {/* O minimapa agora fica diretamente aqui, sem os controles próprios */}
          <div className="absolute inset-0 p-4">
            <Minimap />
          </div>
        </DashboardModule>

        <DashboardModule title="Video Playback" icon={<Video size={20} />} className="h-full">
          <VideoPlayer />
        </DashboardModule>

        <DashboardModule title="Player Details" icon={<BarChart3 size={20} />} className="h-full">
          {selectedParticipant ? (
            <PlayerDetailsContent
              key={selectedParticipant.participantId}
              participant={selectedParticipant}
              onClose={clearSelectedParticipant}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-zinc-500">
              <UserSearch size={48} className="mb-4" />
              <p className="font-semibold text-lg">No Player Selected</p>
              <p className="text-sm">Click on a champion on the minimap to see details.</p>
            </div>
          )}
        </DashboardModule>
      </div>

      <div className="flex-shrink-0">
        <TimelineScrubber />
      </div>
    </div>
  )

  const renderUploadScreen = () => (
    <div className="flex flex-col items-center justify-center h-full max-w-3xl mx-auto text-center">
      <div className="p-10 border-2 border-dashed border-zinc-700 rounded-2xl bg-black/20 w-full">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-green-900/50 rounded-full border border-green-700">
            <UploadCloud className="w-10 h-10 text-green-400" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-zinc-100">Match Visualizer</h1>
        <p className="mt-2 mb-8 text-zinc-400">Upload your match data and video to begin the analysis.</p>
        <FileUploader />
        {error && (
          <div className="mt-6 bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-left">
            <p className="font-bold">An Error Occurred</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <main className="min-h-screen h-screen bg-zinc-950 text-zinc-100 p-6 flex flex-col bg-[radial-gradient(theme(colors.green.900/0.1)_1px,transparent_1px)] [background-size:16px_16px]">
      {!matchData ? renderUploadScreen() : renderDashboard()}
      
      {matchData && (
        <>
          <MatchNotifications />
          <NotificationTestButton />
        </>
      )}
    </main>
  )
}