"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { pullAllCases } from "@/supabase/syncCases"
import { pullAllClients } from "@/supabase/syncClients"
import { Cloud, RefreshCcw } from "lucide-react"
import { toast } from "sonner"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"
import { pullAllAudits } from "@/supabase/syncAudits"
import { pullAllSettings } from "@/supabase/syncSettings"

export function CloudSyncButton() {
  const [syncing, setSyncing] = useState(false)
  const [isOnline, setIsOnline] = useState(true)

  const handleSync = async () => {
    setSyncing(true)
    toast.message("Syncing with cloud...")
    await pullAllClients()
    await pullAllCases()
    await pullAllSettings()
    await pullAllAudits()
    // toast.success("✅ Sync complete")
    setSyncing(false)
  }

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine)

    updateOnlineStatus() // initial
    window.addEventListener("online", updateOnlineStatus)
    window.addEventListener("offline", updateOnlineStatus)

    return () => {
      window.removeEventListener("online", updateOnlineStatus)
      window.removeEventListener("offline", updateOnlineStatus)
    }
  }, [])

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          onClick={handleSync}
          disabled={syncing}
          className="relative rounded-full"
        >
          <Cloud size={20} />

          {/* Connectivity dot */}
          <span
            className={`absolute top-1 right-1 h-2 w-2 rounded-full border border-background ${isOnline ? "bg-green-500" : "bg-red-500"
              }`}
          />

          {/* Spinning overlay during sync */}
          {syncing && (
            <RefreshCcw
              size={14}
              className="absolute text-primary animate-spin"
            />
          )}
          <span className="sr-only">Sync with Cloud</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="center">
        {syncing
          ? "Syncing..."
          : isOnline
            ? "Sync with Cloud (Online)"
            : "Offline - Cannot Sync"}
      </TooltipContent>
    </Tooltip>
  )
}
