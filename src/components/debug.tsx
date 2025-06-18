



import { Button } from "@/components/ui/button"
// import { populateDummyData } from "@/debug-scripts/db-test"
import { Bug } from "lucide-react"
import { toast } from "sonner"

export function Debug() {

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => window.database.deleteCase('0987654321123456')}
      // onClick={() => populateDummyData()}
      className="rounded-full"
    >
      <Bug size={18} />
      <span className="sr-only">Debug</span>
    </Button>
  )
}
