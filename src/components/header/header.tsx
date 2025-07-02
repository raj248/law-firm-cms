import { useLocation } from "react-router-dom"
import { CloudSyncButton } from "./cloud-sync-button"
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
  Cog,
  Search,
} from "lucide-react"
import { UserAvatarDropdown } from "./userAvatarDropdown"
import { UpdateDropdown } from "./updateDropdown"
import { GlobalSearch } from "./global-search"
import { ShowAuditHistoryButton } from "./show-audits-history-button"
// import { Debug } from "./debug"

export function Header() {
  const location = useLocation()

  const iconMap: Record<string, React.ReactNode> = {
    "/": <LayoutDashboard className="w-6 h-6" />,
    "/search": <Search className="w-6 h-6" />,
    "/clients": <Users className="w-6 h-6" />,
    "/cases": <Gavel className="w-6 h-6" />,
    "/task": <ListTodo className="w-6 h-6" />,
    "/docs": <FileText className="w-6 h-6" />,
    "/login_register": <LogIn className="w-6 h-6" />,
    "/user_management": <ShieldCheck className="w-6 h-6" />,
    "/settings": <Cog className="w-6 h-6" />,
  }

  const icon = iconMap[location.pathname] ?? <HelpCircle className="w-6 h-6" />

  return (
    <header className="p-4 flex flex-row items-center justify-between border-b bg-background">
      <div className="flex items-center gap-2">
        {icon}
      </div>

      {/* 🚩 Conditionally render GlobalSearch only if not on /search */}
      {location.pathname !== "/search" && <GlobalSearch />}

      <div className="flex items-center gap-2">
        {/* <Debug /> */}
        <ShowAuditHistoryButton />
        <UpdateDropdown />
        <ThemeToggle />
        <CloudSyncButton />
        <UserAvatarDropdown />
      </div>
    </header>
  )
}
