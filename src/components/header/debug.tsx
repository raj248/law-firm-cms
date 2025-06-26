



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
        window.admin.deleteUser('1cf000b0-2a8f-4953-80fb-d2fba1fb8b77')
      }}
      className="rounded-full"
    >
      <Bug size={18} />
      <span className="sr-only">Debug</span>
    </Button>
  )
}