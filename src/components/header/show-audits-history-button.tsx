import { Button } from "@/components/ui/button"
import { useSyncStore } from "@/stores/sync-store"
import { History } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function ShowAuditHistoryButton() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={() => useSyncStore.getState().setNewAuditNotification(true)}
          variant="outline"
          className="relative rounded-full"
          size="icon"
        >
          <History className="w-4 h-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        Show Audit History
      </TooltipContent>
    </Tooltip>
  )
}
