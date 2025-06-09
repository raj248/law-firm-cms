import { NavigationMenu, NavigationMenuList } from "@/components/ui/navigation-menu"
import { Home, Users, Briefcase, KeySquare, UserRoundPlus } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"

const navItems = [
  { name: "Dashboard", icon: <Home size={18} />, path: "/" },
  { name: "Clients", icon: <Users size={18} />, path: "/clients" },
  { name: "Cases", icon: <Briefcase size={18} />, path: "/cases" },
  { name: "Login", icon: <KeySquare size={18} />, path: "/login" },
  { name: "Register", icon: <UserRoundPlus size={18} />, path: "/register" },
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <aside className="h-full w-full p-4 bg-[var(--color-sidebar)] text-[var(--color-sidebar-foreground)]">
      <NavigationMenu orientation="vertical">
        <NavigationMenuList className="flex flex-col space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={cn(
                "flex w-full items-center gap-6 rounded-md px-6 py-2 text-sm font-medium transition-colors hover:bg-muted",
                location.pathname === item.path && "bg-muted font-semibold"
              )}
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
        </NavigationMenuList>
      </NavigationMenu>
    </aside>
  )
}
