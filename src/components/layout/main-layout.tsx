import { Outlet, useLocation } from "react-router-dom"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "../theme-toggle"
import { Debug } from "../debug"

export default function MainLayout() {
  const location = useLocation()

  const title = {
    "/": "Dashboard",
    "/clients": "Clients",
    "/cases": "Cases",
    "/calender": "Calender",
    "/docs": "Documents",
    "/login": "Login",
    "/register": "Register",
  }[location.pathname] ?? "Untitled"

  return (
    <div className="flex flex-col h-full w-full ml-14 overflow-hidden hide-scrollbar bg-[var(--color-background)] text-[var(--card-foreground)]">

      {/* Header */}
      <header className="p-4 border-b flex flex-row items-center justify-between">
        <h1 className="text-xl font-bold">{title}</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Debug />
        </div>
      </header>

      <Separator />

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto hide-scrollbar p-4">
        <Outlet />
      </main>

    </div>
  )
}
