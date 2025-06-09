import './index.css'
import { ThemeProvider } from "@/components/theme-provider"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from './components/sidebar';
import MainLayout from './components/layout/main-layout';
import Dashboard from './components/pages/dashboard';
import Clients from './components/pages/clients';
import Cases from './components/pages/cases';
function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <Router>
        <div className="w-screen h-screen">
          <ResizablePanelGroup direction="horizontal" className="h-full w-full">
            <ResizablePanel defaultSize={25} minSize={20} maxSize={30}>
              <Sidebar />
            </ResizablePanel>

            {/* <ResizableHandle /> */}

            <ResizablePanel defaultSize={75}>
              {/* <MainLayout /> */}
              <Routes>
                <Route element={<MainLayout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/clients" element={<Clients />} />
                  <Route path="/cases" element={<Cases />} />
                </Route>
              </Routes>
            </ResizablePanel>
          </ResizablePanelGroup>

          {/* Routes below */}
        </div>
      </Router>
    </ThemeProvider>
  );
}


export default App
