



import { Button } from "@/components/ui/button"
import { useClientStore } from "@/stores/client-store"
import { useSyncStore } from "@/stores/sync-store"
import { supabase } from "@/supabase/supabase"
import { syncClientsToSupabase, syncSupabaseToClients } from "@/supabase/syncClients"
import { Bug } from "lucide-react"
export function Debug() {
  const lastSyncTime = useSyncStore.getState().lastSyncedAt

  return (
    <Button
      variant="outline"
      size="icon"
      // onClick={() => window.debug.log(useClientStore.getState().clients)}
      onClick={() => { syncSupabaseToClients(lastSyncTime) }}
      className="rounded-full"
    >
      <Bug size={18} />
      <span className="sr-only">Debug</span>
    </Button>
  )
}

const fetchClients = async () => {

  const { data: allowedUser, error: lookupError } = await supabase
    .from("allowed_users")
    .select("id, user_id")

  window.debug.log(allowedUser, lookupError)
}