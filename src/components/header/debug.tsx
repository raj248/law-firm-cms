



import { Button } from "@/components/ui/button"
import { supabase } from "@/supabase/supabase"
import { Bug } from "lucide-react"
export function Debug() {

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => fetchClients()}
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