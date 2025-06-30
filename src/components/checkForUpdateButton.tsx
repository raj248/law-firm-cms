import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Loader2, RefreshCcw } from "lucide-react"

export function CheckForUpdateButton() {
  const [checking, setChecking] = useState(false)

  const handleCheckUpdate = async () => {
    setChecking(true)
    try {
      window.electronUpdater.checkForUpdate()
    } catch (error) {
      console.error("Error checking for update:", error)
    } finally {
      setChecking(false)
    }
  }

  return (
    <Button
      onClick={handleCheckUpdate}
      disabled={checking}
      variant="outline"
      className="gap-2"
    >
      {checking ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Checking...
        </>
      ) : (
        <>
          <RefreshCcw className="size-4" />
          Check for Updates
        </>
      )}
    </Button>
  )
}
