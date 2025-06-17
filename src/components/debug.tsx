// components/ThemeToggle.tsx
import { Button } from "@/components/ui/button"
// import { populateDummyData } from "@/debug-scripts/db-test"
import { Bug } from "lucide-react"



export function Debug() {

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={async () => window.debug.log(await window.database.getAllCases())}
      // onClick={() => populateDummyData()}
      className="rounded-full"
    >
      <Bug size={18} />
      <span className="sr-only">Debug</span>
    </Button>
  )
}
