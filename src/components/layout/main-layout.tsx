import { Outlet } from "react-router-dom"
import { Toaster } from "@/components/ui/sonner"
import { Header } from "../header/header"
import { useTheme } from "@/hooks/theme-provider"

export default function MainLayout() {
  const { theme } = useTheme()

  return (
    <div className="flex flex-col h-full w-full ml-14 overflow-hidden hide-scrollbar bg-[var(--color-background)] text-[var(--card-foreground)]">

      {/* Header */}
      <Header />

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto hide-scrollbar p-4">
        <Outlet />
        <Toaster
          richColors
          expand
          closeButton
          theme={theme}
          visibleToasts={8} />
      </main>

    </div>
  )
}
