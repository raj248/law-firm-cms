"use client"

import { useUserStore } from "@/stores/user-store"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useNavigate } from "react-router-dom";
import { Cog, LogOut, User } from "lucide-react"
import { supabase } from "@/supabase/supabase"
import { toast } from "sonner"

export function UserAvatarDropdown() {
  const { currentUser } = useUserStore()

  if (!currentUser) return null

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error("Logout failed", { description: error.message })
    } else {
      toast.success("Logged out")
    }
  }
  const navigate = useNavigate();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="rounded-full p-0 w-9 h-9">
          <Avatar className="w-9 h-9">
            <AvatarImage
              src={`https://api.dicebear.com/9.x/identicon/svg?seed=${currentUser.name}`}
              alt={currentUser.name}
            />
            <AvatarFallback>
              {currentUser.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <div className="flex flex-col items-center justify-center space-y-2 p-3">
          <Avatar className="w-12 h-12">
            <AvatarImage
              src={`https://api.dicebear.com/9.x/identicon/svg?seed=${currentUser.name}`}
              alt={currentUser.name}
            />
            <AvatarFallback>
              {currentUser.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="text-center space-y-0.5">
            <div className="font-medium">{currentUser.name}</div>
            <div className="text-xs text-muted-foreground">{currentUser.email}</div>
            <div className="text-xs text-muted-foreground capitalize">{currentUser.role}</div>
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => toast.message("Profile coming soon!")}>
          <User className="mr-2 h-4 w-4" /> Profile
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate("/settings")}>
          <Cog className="mr-2 h-4 w-4" /> Settings
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" /> Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
