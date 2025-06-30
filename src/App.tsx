import { ThemeProvider, useTheme } from "@/hooks/theme-provider"
import { HashRouter as Router, Routes, Route } from "react-router-dom"

import Sidebar from "@/components/sidebar"
import MainLayout from "@/components/layout/main-layout"
import Dashboard from "@/components/pages/dashboard"
import Clients from "@/components/pages/clients"
import Cases from "@/components/pages/cases"
import TaskPage from "./components/pages/task"
import DocumentsPage from "./components/pages/documents"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { DialogPortal } from "./components/dialogs/details/main-dialog-portal"
import AuthPage from "@/components/pages/auth"
import UserManagement from "./components/pages/admin/UserManagement"
import SettingsPage from "./components/pages/settings"
import { useUpdateListener } from "./hooks/useUpdateListener"
import { useUserStore } from "./stores/user-store"
import { useSyncHook } from "./hooks/useSyncHook"
import { useEffect } from "react"
import { useAuditStore } from "./stores/audit-store"
import { useCaseStore } from "./stores/case-store"
import { useClientStore } from "./stores/client-store"
import { useDocumentStore } from "./stores/document-store"
import { useSettingsStore } from "./stores/settings-store"
import { useTaskStore } from "./stores/task-store"
import SearchPage from "./components/pages/search"

export default function App() {
  const fetchDocuments = useDocumentStore((s) => s.fetchDocuments)
  const fetchClients = useClientStore((s) => s.fetchClients)
  const fetchCases = useCaseStore((s) => s.fetchCases)
  const fetchTasks = useTaskStore((s) => s.fetchTasks)
  const { fetchCourts, fetchTags } = useSettingsStore()
  const fetchAudits = useAuditStore((s) => s.fetchAudits)
  const { isCurrentUserAdmin } = useUserStore()
  const { theme } = useTheme()
  useEffect(() => {
    fetchAudits()
    fetchDocuments()
    fetchClients()
    fetchCases()
    fetchTasks()
    fetchCourts()
    fetchTags()
    window.debug.log("App rendered", Date.now())
  }, [])
  useUpdateListener()
  useSyncHook()
  return (
    <ThemeProvider defaultTheme={theme} storageKey="vite-ui-theme">
      <Router>
        <div className="w-screen h-screen flex flex-row ">
          <Sidebar />
          {/* <UpdateDialog /> */}

          {/* Main content */}
          <Routes>
            {/* Public routes — no auth */}
            <Route path="/login_register" element={<AuthPage />} />

            {/* Protected routes — with layout */}
            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/cases" element={<Cases />} />
              <Route path="/task" element={<TaskPage />} />
              <Route path="/docs" element={<DocumentsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              {isCurrentUserAdmin() && (<Route path="/user_management" element={<UserManagement />} />)}
            </Route>
          </Routes>

          {/* End main content */}
          <div className="relative flex justify-center items-start">
            <DialogPortal />
          </div>
        </div>
      </Router>
    </ThemeProvider>
  )
}
