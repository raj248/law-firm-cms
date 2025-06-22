import { ThemeProvider, useTheme } from "@/components/theme-provider"
import { HashRouter as Router, Routes, Route } from "react-router-dom"

import Sidebar from "@/components/sidebar"
import MainLayout from "@/components/layout/main-layout"
import Dashboard from "@/components/pages/dashboard"
import LoginPage from "@/components/pages/login"
import RegisterPage from "@/components/pages/register"
import Clients from "@/components/pages/clients"
import Cases from "@/components/pages/cases"
import TaskPage from "./components/pages/task"
import DocumentsPage from "./components/pages/documents"
import { useClientStore } from "./stores/client-store"
import { useEffect } from "react"
import { useCaseStore } from "./stores/case-store"
import { useTaskStore } from "./stores/task-store"
import { DialogPortal } from "./components/dialogs/DialogPortal"

export default function App() {
  const fetchClients = useClientStore((s) => s.fetchClients)
  const fetchCases = useCaseStore((s) => s.fetchCases)
  const fetchTasks = useTaskStore((s) => s.fetchTasks)


  useEffect(() => {
    window.debug.log("Fetching clients...")
    fetchClients()
    window.debug.log("Fetching cases...")
    fetchCases()
    window.debug.log("Fetching tasks...")
    fetchTasks()
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
              <Route path="/task" element={<TaskPage />} />
              <Route path="/docs" element={<DocumentsPage />} />
            </Route>
          </Routes>
          {/* End main content */}
          <DialogPortal />
        </div>
      </Router>
    </ThemeProvider>
  )
}
