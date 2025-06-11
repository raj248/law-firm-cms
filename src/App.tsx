import { ThemeProvider } from "@/components/theme-provider"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"

import Sidebar from "@/components/sidebar"
import MainLayout from "@/components/layout/main-layout"
import Dashboard from "@/components/pages/dashboard"
import LoginPage from "@/components/pages/login"
import RegisterPage from "@/components/pages/register"
import Clients from "@/components/pages/clients"
import Cases from "@/components/pages/cases"
import CalenderPage from "./components/pages/calender"
import DocumentsPage from "./components/pages/documents"

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
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
