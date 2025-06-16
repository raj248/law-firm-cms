import { ThemeProvider, useTheme } from "@/components/theme-provider"
import { HashRouter as Router, Routes, Route } from "react-router-dom"

import Sidebar from "@/components/sidebar"
import MainLayout from "@/components/layout/main-layout"
import Dashboard from "@/components/pages/dashboard"
import LoginPage from "@/components/pages/login"
import RegisterPage from "@/components/pages/register"
import Clients from "@/components/pages/clients"
import Cases from "@/components/pages/cases"
import CalenderPage from "./components/pages/calender"
import DocumentsPage from "./components/pages/documents"
import { useClientStore } from "./stores/client-store"
import { useEffect } from "react"

export default function App() {
  const clients = useClientStore((s) => s.clients)
  const fetchClients = useClientStore((s) => s.fetchClients)

  useEffect(() => {
    window.debug.log("Fetching clients...")
    fetchClients().then(() => console.log("Clients fetched", clients)).catch(console.error)
  }, [])

  const { theme } = useTheme()

  return (
    <ThemeProvider defaultTheme={theme} storageKey="vite-ui-theme">
      <Router>
        <div className="w-screen h-screen flex flex-row ">
          <Sidebar />

          {/* Main content */}
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/cases" element={<Cases />} />
              <Route path="/calender" element={<CalenderPage />} />
              <Route path="/docs" element={<DocumentsPage />} />
            </Route>
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  )
}
