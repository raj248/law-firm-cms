import { useLocation } from "react-router-dom"
import { Debug } from "./debug"
import { GlobalSearch } from "./global-search"
import { CloudSyncButton } from "./CloudSyncButton"
import { ThemeToggle } from "./theme-toggle"

import {
  LayoutDashboard,
  Users,
  Gavel,
  ListTodo,
  FileText,
  LogIn,
  ShieldCheck,
  HelpCircle,
} from "lucide-react"
import { UserAvatarDropdown } from "./userAvatarDropdown"
import { UpdateDropdown } from "./updateDropdown"

export function Header() {
  const location = useLocation()

  const iconMap: Record<string, React.ReactNode> = {
    "/": <LayoutDashboard className="w-6 h-6" />,
    "/clients": <Users className="w-6 h-6" />,
    "/cases": <Gavel className="w-6 h-6" />,
    "/task": <ListTodo className="w-6 h-6" />,
    "/docs": <FileText className="w-6 h-6" />,
    "/login_register": <LogIn className="w-6 h-6" />,
    "/user_management": <ShieldCheck className="w-6 h-6" />,
  }

  const icon = iconMap[location.pathname] ?? <HelpCircle className="w-6 h-6" />

  return (
    <header className="p-4 flex flex-row items-center justify-between border-b bg-background">
      <div className="flex items-center gap-2">
        {icon}
      </div>
      <GlobalSearch />
      <div className="flex items-center gap-2">
        <Debug />
        <UpdateDropdown />
        <ThemeToggle />
        <CloudSyncButton />
        <UserAvatarDropdown />
      </div>
    </header>
  )
}
