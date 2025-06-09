import {
  NavigationMenu,
  NavigationMenuList
} from "@/components/ui/navigation-menu"
import { Button } from "@/components/ui/button"
import {
  Home,
  Users,
  Briefcase,
  KeySquare,
  UserRoundPlus,
  ChevronsLeft
} from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"

const navItems = [
  { name: "Dashboard", icon: <Home size={18} />, path: "/" },
  { name: "Clients", icon: <Users size={18} />, path: "/clients" },
  { name: "Cases", icon: <Briefcase size={18} />, path: "/cases" },
  { name: "Login", icon: <KeySquare size={18} />, path: "/login" },
  { name: "Register", icon: <UserRoundPlus size={18} />, path: "/register" },
]

export default function Sidebar({ collapsePanel }: { collapsePanel: () => void }) {
  const location = useLocation()

  return (
    <div className="h-full flex flex-col justify-between px-2 py-4">
      <NavigationMenu orientation="vertical">
        <NavigationMenuList className="flex flex-col space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={cn(
                "flex w-full items-center gap-4 rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-muted",
                location.pathname === item.path && "bg-muted font-semibold"
              )}
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
        </NavigationMenuList>
      </NavigationMenu>

      {/* Collapse Button at the Bottom */}
      <Button
        variant="ghost"
        size="sm"
        onClick={collapsePanel}
        className="mt-4 flex items-center justify-center gap-2 self-end"
      >
        <ChevronsLeft className="h-4 w-4" />
        Collapse
      </Button>
    </div>
  )
}
