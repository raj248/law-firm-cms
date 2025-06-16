/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * The built directory structure
     *
     * ```tree
     * ├─┬─┬ dist
     * │ │ └── index.html
     * │ │
     * │ ├─┬ dist-electron
     * │ │ ├── main.js
     * │ │ └── preload.js
     * │
     * ```
     */
    APP_ROOT: string
    /** /dist/ or /public/ */
    VITE_PUBLIC: string
  }
}

// Used in Renderer process, exposed via `preload.ts`
interface ElectronAPI {
  openFile: (filePath: string) => Promise<string | null>
}

interface DB {
  // Clients
  insertClient: (client: Client) => Promise<{ success: boolean; error?: string }>
  getAllClients: () => Promise<Client[]>
  deleteClient: (id: string) => void

  // Cases
  insertCase: (legalCase: Case) => Promise<{ success: boolean; error?: string }>
  getAllCases: () => Promise<Case[]>
  getCasesByClient: (clientId: string) => Promise<Case[]>
  deleteCase: (id: string) => void

  // Tasks
  insertTask: (task: Task) => void
  getAllTasks: () => Promise<Task[]>
  getTasksByClient: (clientId: string) => Promise<Task[]>
  deleteTask: (id: string) => void
}
interface Window {
  ipcRenderer: import('electron').IpcRenderer
  electronAPI: ElectronAPI
  database: DB
}
