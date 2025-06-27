'use client'

import { useUpdateStore } from "@/stores/update-store"
import { useUpdateListener } from "@/hooks/useUpdateListener"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

export function UpdateDialog() {
  useUpdateListener()

  const {
    updateAvailable,
    version,
    releaseNotes,
    releaseName,
    progress,
    downloaded,
  } = useUpdateStore()

  return (
    <Dialog open={updateAvailable}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {downloaded ? "✅ Update Ready" : "⬇️ Update Available"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2 text-sm text-muted-foreground">
          {downloaded ? (
            <p>
              Version <span className="font-medium">{version}</span> has been downloaded and is ready to install.
            </p>
          ) : (
            <p>
              Downloading version <span className="font-medium">{version}</span>... ({progress.toFixed(1)}%)
            </p>
          )}
        </div>

        {!downloaded && (
          <Progress value={progress} className="h-2 bg-muted mt-3" />
        )}

        {!downloaded && releaseNotes && (
          <div className="mt-4">
            <Separator className="mb-2" />
            <h4 className="text-sm font-semibold mb-1">{releaseName || "Release Notes"}</h4>
            <ScrollArea className="h-[150px] rounded-md border p-2 text-sm">
              <pre className="whitespace-pre-wrap font-sans text-muted-foreground">
                {releaseNotes}
              </pre>
            </ScrollArea>
          </div>
        )}

        <DialogFooter className="mt-4">
          {downloaded ? (
            <Button onClick={() => window.electronUpdater?.restartApp()}>
              🔁 Restart to Update
            </Button>
          ) : (
            <Button variant="secondary" disabled>
              Downloading...
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
