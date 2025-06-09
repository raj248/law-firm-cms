import { ThemeProvider } from "@/components/theme-provider"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable"
import { ImperativePanelHandle } from "react-resizable-panels";
import { useRef } from "react"
import Sidebar from "@/components/sidebar"
import MainLayout from "@/components/layout/main-layout"
import Dashboard from "@/components/pages/dashboard"
import LoginPage from "@/components/pages/login"
import RegisterPage from "@/components/pages/register"
import Clients from "@/components/pages/clients"
import Cases from "@/components/pages/cases"

export default function App() {
  const sidebarRef = useRef<ImperativePanelHandle>(null)

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <Router>
        <div className="w-screen h-screen">
          <ResizablePanelGroup direction="horizontal" className="h-full w-full">
            <ResizablePanel
              ref={sidebarRef}
              defaultSize={15}
              minSize={10}
              maxSize={20}
              collapsible={true}
              collapsedSize={0}
              onCollapse={() => console.log(sidebarRef.current)}
              className="border-r"
              itemRef="sidebarRef"
            >
              <Sidebar collapsePanel={() => sidebarRef.current?.collapse()} />
            </ResizablePanel>

            <ResizableHandle />

            <ResizablePanel defaultSize={85}>
              <Routes>
                <Route element={<MainLayout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/clients" element={<Clients />} />
                  <Route path="/cases" element={<Cases />} />
                </Route>
              </Routes>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </Router>
    </ThemeProvider>
  )
}
