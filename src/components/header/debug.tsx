



import { Button } from "@/components/ui/button"
import { supabase } from "@/supabase/supabase"
import { Bug } from "lucide-react"
export function Debug() {
  // const { resetLastSyncedAt, lastSyncedAt, clear } = useSyncStore.getState()

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={async () => {
        window.debug.log(await window.database.getAllClients())
      }}
      className="rounded-full"
    >
      <Bug size={18} />
      <span className="sr-only">Debug</span>
    </Button>
  )
}