"use client"

import type React from "react"

import { useCallback, useState } from "react"
import { Upload, FileJson, Youtube } from "lucide-react"
import { useMatchLoader } from "@/hooks/use-match-loader"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function FileUploader() {
  const { loadJSONL, isLoading, loadingProgress } = useMatchLoader()
  const [videoUrl, setVideoUrl] = useState("")
  const [jsonlFile, setJsonlFile] = useState<File | null>(null)
  const handleLoadAll = useCallback(async () => {
    if (!jsonlFile) {
      alert("Please select a JSONL file")
      return
    }

    try {
      await loadJSONL(jsonlFile, videoUrl || undefined)

    } catch (error) {
      console.error("[v0] Failed to load files:", error)
    }
  }, [jsonlFile, videoUrl, loadJSONL])

  const handleJSONLSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setJsonlFile(file)
  }, [])


  const canLoad = jsonlFile !== null

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <Youtube className="h-4 w-4" />
          YouTube Video URL (Optional)
        </label>
        <input
          type="text"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FileSelectBox
          title="Match Data (JSONL)"
          description={jsonlFile ? jsonlFile.name : "Select .jsonl file"}
          icon={<FileJson className="h-8 w-8" />}
          accept=".jsonl"
          onChange={handleJSONLSelect}
          disabled={isLoading}
          selected={!!jsonlFile}
        />
      </div>

      <Button onClick={handleLoadAll} disabled={!canLoad || isLoading} className="w-full" size="lg">
        <Upload className="h-4 w-4 mr-2" />
        Load Match Data
      </Button>

      {isLoading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Loading...</span>
            <span className="font-medium">{Math.round(loadingProgress * 100)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${loadingProgress * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

interface FileSelectBoxProps {
  title: string
  description: string
  icon: React.ReactNode
  accept: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
  selected?: boolean
}

function FileSelectBox({ title, description, icon, accept, onChange, disabled, selected }: FileSelectBoxProps) {
  return (
    <label
      className={cn(
        "relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
        selected ? "border-primary bg-primary/5" : "border-border hover:border-primary hover:bg-primary/5",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      <input type="file" accept={accept} onChange={onChange} disabled={disabled} className="sr-only" />
      <div className={cn("mb-3", selected ? "text-primary" : "text-muted-foreground")}>{icon}</div>
      <h3 className="font-medium mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground text-center truncate max-w-full px-2">{description}</p>
    </label>
  )
}
