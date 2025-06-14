// components/ThemeToggle.tsx
import { Button } from "@/components/ui/button"
import { Bug } from "lucide-react"



export function Debug() {

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => window.db.dbTest()}
      className="rounded-full"
    >
      <Bug size={18} />
      <span className="sr-only">Debug</span>
    </Button>
  )
}
