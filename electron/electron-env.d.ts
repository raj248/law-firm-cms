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
  checkForUpdates: () => Promise<UpdateCheckResult | null>
}

interface DB {
  // Clients
  insertClient: (client: Client) => Promise<{ success: boolean; error?: string }>
  getAllClients: () => Promise<Client[]>
  deleteClient: (id: string) => Promise<{ success: boolean; error?: string }>
  updateClientField: (id: string, field: keyof Client, value: string) => Promise<{ success: boolean; error?: string }>

  // Cases
  insertCase: (legalCase: Case) => Promise<{ success: boolean; error?: string }>
  getAllCases: () => Promise<Case[]>
  deleteCase: (id: string) => Promise<{ success: boolean; error?: string }>
  updateCase: (id: string, field: keyof Case, value: any) => Promise<{ success: boolean; updatedCase?: Case; error?: string }> 

  // Tasks
  insertTask: (task: Task) => Promise<{ success: boolean; error?: string }>
  getAllTasks: () => Promise<Task[]>
  updateTask: (task: Task) => promises<{ success: boolean; error?: string }>
  deleteTask: (id: string) => Promise<{ success: boolean; error?: string }>
}
interface Window {
  ipcRenderer: import('electron').IpcRenderer
  electronAPI: ElectronAPI
  database: DB
}
