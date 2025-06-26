import { Button } from "@/components/ui/button"
import { signOut } from "@/supabase/auth"
import { LogOut } from "lucide-react"

export function Logout() {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => signOut()}
      className="rounded-full"
    >
      <LogOut size={18} />
      <span className="sr-only">Log Out</span>
    </Button>
  )
}