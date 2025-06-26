import { Button } from "@/components/ui/button"
import { pullAllCases } from "@/supabase/syncCases";
import { pullAllClients } from "@/supabase/syncClients"
import { CloudDownload } from "lucide-react"

export function PullCloudButton() {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => { pullAllClients(); pullAllCases() }}
      className="rounded-full"
    >
      <CloudDownload size={18} />
      <span className="sr-only">Log Out</span>
    </Button>
  )
}