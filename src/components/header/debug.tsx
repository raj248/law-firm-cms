



import { Button } from "@/components/ui/button"
import { deleteCase } from "@/supabase/cloud-cases"
import { deleteClient } from "@/supabase/cloud-clients"
import { Bug } from "lucide-react"
export function Debug() {
  // const { resetLastSyncedAt, lastSyncedAt, clear } = useSyncStore.getState()

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={async () => {
        window.debug.log(await deleteClient('ba34233c-32cc-4160-aa48-336dbf90085b'))
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