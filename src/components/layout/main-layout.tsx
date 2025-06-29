import { Outlet } from "react-router-dom"
import { Toaster } from "@/components/ui/sonner"
import { Header } from "../header/header"
import { useTheme } from "@/hooks/theme-provider"
import { ActivityFeedPopover } from "../dashboard/activity-feed-popover"
import { useEffect, useState } from "react"
import { useSyncStore } from "@/stores/sync-store"
import { useAuditStore } from "@/stores/audit-store"

export default function MainLayout() {
  const { audits } = useAuditStore()
  const [newActivityTrigger, setNewActivityTrigger] = useState(false)
  const newAuditNotification = useSyncStore(s => s.newAuditNotification)

  useEffect(() => {
    if (newAuditNotification) {
      setNewActivityTrigger(true)

      // Reset flag after triggering to prevent re-triggers
      useSyncStore.getState().setNewAuditNotification(false)
    }
  }, [newAuditNotification])

  const { theme } = useTheme()

  return (
    <div className="flex flex-col h-full w-full ml-14 overflow-hidden hide-scrollbar bg-[var(--color-background)] text-[var(--card-foreground)]">

      {/* Header */}
      <Header />

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto hide-scrollbar p-4">
        <Outlet />
        <Toaster
          richColors
          expand
          closeButton
          theme={theme}
          visibleToasts={8} />
      </main>
      <ActivityFeedPopover
        audits={audits}
        newActivityTrigger={newActivityTrigger}
        onDismiss={() => setNewActivityTrigger(false)}
      />
    </div>
  )
}
