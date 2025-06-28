"use client"

import { useUpdateStore } from "@/stores/update-store"
import { useUpdateListener } from "@/hooks/useUpdateListener"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { RefreshCcw, CheckCircle, DownloadCloud } from "lucide-react"

export function UpdateDropdown() {
  useUpdateListener()

  const {
    updateAvailable,
    version,
    releaseNotes,
    releaseName,
    progress,
    downloaded,
  } = useUpdateStore()

  if (!updateAvailable) return null

  return (
    <Popover open={updateAvailable}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-4 right-4 z-50 shadow-md rounded-full"
        >
          {downloaded ? (
            <CheckCircle className="text-green-600" size={20} />
          ) : (
            <DownloadCloud className="text-primary" size={20} />
          )}
          <span className="sr-only">Update Available</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-80 sm:w-96 p-4 shadow-xl border"
        align="end"
        side="top"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {downloaded ? (
              <CheckCircle className="text-green-600" size={20} />
            ) : (
              <RefreshCcw className="animate-spin text-primary" size={20} />
            )}
            <h2 className="font-semibold text-base">
              {downloaded ? "✅ Update Ready" : "⬇️ Update Available"}
            </h2>
          </div>

          <p className="text-sm text-muted-foreground">
            {downloaded ? (
              <>
                Version <span className="font-medium">{version}</span> has been
                downloaded and is ready to install.
              </>
            ) : (
              <>
                Downloading version <span className="font-medium">{version}</span>... (
                {progress.toFixed(1)}%)
              </>
            )}
          </p>

          {!downloaded && (
            <Progress value={progress} className="h-2 bg-muted" />
          )}

          {releaseNotes && (
            <>
              <Separator />
              <h4 className="text-sm font-medium">
                {releaseName || "Release Notes"}
              </h4>
              <ScrollArea className="h-[150px] rounded-md border p-2 text-xs">
                <pre className="whitespace-pre-wrap font-sans text-muted-foreground">
                  {releaseNotes}
                </pre>
              </ScrollArea>
            </>
          )}

          <div className="pt-2">
            {downloaded ? (
              <Button
                variant="default"
                size="sm"
                className="w-full"
                onClick={() => window.electronUpdater?.restartApp()}
              >
                🔁 Restart to Update
              </Button>
            ) : (
              <Button variant="secondary" size="sm" className="w-full" disabled>
                Downloading...
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
