import { Outlet, useLocation } from "react-router-dom"
import { Separator } from "@/components/ui/separator"

export default function MainLayout() {
  const location = useLocation()

  const title = {
    "/": "Dashboard",
    "/clients": "Clients",
    "/cases": "Cases",
    "/login": "Login",
    "/register": "Register",
  }[location.pathname] ?? "Untitled"

  return (
    <div className="flex flex-col h-full w-full ml-14 overflow-hidden hide-scrollbar bg-[var(--card)] text-[var(--card-foreground)]">

      {/* Header */}
      <header className="p-4 border-b">
        <h1 className="text-xl font-bold">{title}</h1>
      </header>

      <Separator />

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto hide-scrollbar p-4">
        <Outlet />
      </main>

    </div>
  )
}
