"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useDocumentStore } from "@/stores/document-store"
import { Bug, RefreshCcw, Terminal } from "lucide-react"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
import { useSyncStore } from "@/stores/sync-store"

export function Debug() {
  const fetchDocuments = useDocumentStore((s) => s.fetchDocuments)
  const [open, setOpen] = useState(false)

  const handleFetchDocs = async () => {
    await fetchDocuments()
    window.debug.log("Fetched documents")
  }

  const handleLogVersion = async () => {
    const version = await window.electronAPI.getAppVersion()
    window.debug.log("App version:", version)
  }

  const handleFetchAudits = async () => {
    const audits = await window.database.getAllAudits()
    window.debug.log("Fetched audits", audits)
  }


  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          aria-label="Debug Tools"
        >
          <Bug size={18} />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-48 p-2 space-y-1" align="end" side="bottom">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={() => useSyncStore.getState().setNewAuditNotification(true)}
        >
          <Terminal size={16} className="mr-2" />
          New Notification
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={handleFetchDocs}
        >
          <RefreshCcw size={16} className="mr-2" />
          Fetch Documents
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={handleFetchAudits}
        >
          <RefreshCcw size={16} className="mr-2" />
          Fetch Audits
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={handleLogVersion}
        >
          <Terminal size={16} className="mr-2" />
          Log App Version
        </Button>

      </PopoverContent>
    </Popover>
  )
}
