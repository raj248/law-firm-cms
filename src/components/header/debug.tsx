



import { Button } from "@/components/ui/button"
import { Bug } from "lucide-react"
export function Debug() {
  // const { resetLastSyncedAt, lastSyncedAt, clear } = useSyncStore.getState()

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={async () => {
        window.debug.log(await window.database.unsyncedCases())
      }}
      // onClick={() => {
      //   clear()
      //   resetLastSyncedAt()
      //   window.debug.log("Reset last synced at ", lastSyncedAt)
      // }}
      className="rounded-full"
    >
      <Bug size={18} />
      <span className="sr-only">Debug</span>
    </Button>
  )
}