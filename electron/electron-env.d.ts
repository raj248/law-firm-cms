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
  insertClient: (client: Client) => Promise<{ success: boolean; error?: string; data?: Client }>
  getAllClients: () => Promise<Client[]>
  deleteClient: (id: string) => Promise<{ success: boolean; error?: string }>
  updateClientField: (id: string, field: keyof Client, value: string) => Promise<{ success: boolean; error?: string }>

  // Cases
  insertCase: (legalCase: Case) => Promise<{ success: boolean; error?: string; data?: Case}>
  getAllCases: () => Promise<Case[]>
  deleteCase: (id: string) => Promise<{ success: boolean; error?: string }>
  updateCase: (id: string, field: keyof Case, value: any) => Promise<{ success: boolean; updatedCase?: Case; error?: string }> 

  // Tasks
  insertTask: (task: Task) => Promise<{ success: boolean; error?: string }>
  getAllTasks: () => Promise<Task[]>
  updateTask: (task: Task) => promises<{ success: boolean; error?: string }>
  deleteTask: (id: string) => Promise<{ success: boolean; error?: string }>

  // Settings
  getAllCourts: () => Promise<Court[]>
  getAllTags: () => Promise<Tag[]>
  unsyncedCourts: () => Promise<Court[]>
  unsyncedTags: () => Promise<Tag[]>

  insertCourt:(name: string, id?: string, is_synced?: number) => boolean
  insertTag:(name: string, id?: string, is_synced?: number) => boolean
  updateCourtSync: (id: string) => void
  updateTagSync: (id: string) => void

  // Sync
  unsyncedClients: () => Promise<Client[]>
  updateClientSync: (id: string) => Promise<{ success: boolean; error?: string }>
  insertOrUpdateClients: (data: Client[]) => void

  unsyncedCases: () => Promise<Cases[]>
  updateCaseSync: (id: string) => Promise<{ success: boolean; error?: string }>
  insertOrUpdateCases: (data: Case[]) => void
}

interface Admin {
  deleteUser: (userId :string) => Promise<{ success: boolean; error?: string }>
}

interface ElectronUpdater {
  onUpdateAvailable : (callback: (event: any, info: {
      version: string
      releaseNotes: string
      releaseName: string
    }) => void) => void 
  onDownloadProgress : (callback: (event: any, percent: number) => void ) => void
  onUpdateDownloaded : (callback: () => void) => void
  restartApp: () => void
}
interface Window {
  ipcRenderer: import('electron').IpcRenderer
  electronUpdater: ElectronUpdater
  electronAPI: ElectronAPI
  database: DB
  admin: Admin
}
