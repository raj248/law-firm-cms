import { Client, Case, Task, Court, Tag } from '@/types'
import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose APIs to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },
  
})

contextBridge.exposeInMainWorld('electronUpdater', {
  onUpdateAvailable: (cb: (event: any, info: {
      version: string
      releaseNotes: string
      releaseName: string
    }) => void) => ipcRenderer.on('update_available', cb),
  onDownloadProgress: (cb: (event: any, percent: number) => void) =>
    ipcRenderer.on('update_download_progress', cb),
  onUpdateDownloaded: (cb: () => void) => ipcRenderer.on('update_downloaded', cb),
  restartApp: () => ipcRenderer.send('restart_app'),
})

contextBridge.exposeInMainWorld('debug', {
  log: (...args: any[]) => ipcRenderer.send('log', ...args),
})

// --------- Expose shell.openPath ---------
contextBridge.exposeInMainWorld('electronAPI', {
  openFile: (filePath: string) => ipcRenderer.invoke('open-file', filePath),
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-update'),
  saveTempFile: (fileName: string, buffer: ArrayBuffer)=> ipcRenderer.invoke('save-temp-file', fileName, buffer),
})

contextBridge.exposeInMainWorld('database', {
  // Clients
  insertClient: (client: Client) => ipcRenderer.invoke('database:insert-client', client),
  getAllClients: (): Promise<Client[]> => ipcRenderer.invoke('database:get-all-clients'),
  deleteClient: (id: string) => ipcRenderer.invoke('database:delete-client', id),
  updateClientField: (id:string, field:keyof Client, value:string) => ipcRenderer.invoke('database:update-client-field', id, field, value),

  // Cases
  insertCase: (legalCase: Case) => ipcRenderer.invoke('database:insert-case', legalCase),
  getAllCases: (): Promise<Case[]> => ipcRenderer.invoke('database:get-all-cases'),
  getCasesByClient: (client_id: string): Promise<Case[]> =>
    ipcRenderer.invoke('database:get-cases-by-client', client_id),
  deleteCase: (id: string) => ipcRenderer.invoke('database:delete-case', id),
  updateCase: (id: string, field: keyof Case, value: any) => ipcRenderer.invoke('database:update-case', id, field, value),

  // Tasks
  insertTask: (task: Task) => ipcRenderer.invoke('database:insert-task', task),
  getAllTasks: (): Promise<Task[]> => ipcRenderer.invoke('database:get-all-tasks'),
  getTasksByClient: (client_id: string): Promise<Task[]> =>
    ipcRenderer.invoke('database:get-tasks-by-client', client_id),
  updateTask: (task: Task): Promise<{ success: boolean; error?: string }>=> ipcRenderer.invoke('database:update-task', task),

  deleteTask: (id: string) => ipcRenderer.invoke('database:delete-task', id),

  // Settings
  getAllCourts: ()=> ipcRenderer.invoke('get-courts'),
  getAllTags: ()=> ipcRenderer.invoke('get-tags'),
  unsyncedCourts: (): Promise<Court[]> => ipcRenderer.invoke('unsynced-courts'),
  unsyncedTags: (): Promise<Tag[]> => ipcRenderer.invoke('unsynced-tags'),

  insertCourt:(name: string, id?: string, is_synced?: number) => ipcRenderer.invoke('insert-court', name, id, is_synced),
  insertTag:(name: string, id?: string, is_synced?: number) => ipcRenderer.invoke('insert-tag', name, id, is_synced),
  updateCourtSync: (id: string) => ipcRenderer.invoke('update-court-sync', id),
  updateTagSync: (id: string) => ipcRenderer.invoke('update-tag-sync', id),

  // Sync
  unsyncedClients: (): Promise<Client[]> => ipcRenderer.invoke('unsynced-clients'),
  updateClientSync: (id: string): Promise<{ success: boolean; error?: string }> => ipcRenderer.invoke('update-client-sync', id),
  insertOrUpdateClients: (data: Client[]) => ipcRenderer.invoke('insert-or-update-clients', data),

  unsyncedCases: (): Promise<Case[]> => ipcRenderer.invoke('unsynced-cases'),
  updateCaseSync: (id: string): Promise<{ success: boolean; error?: string }> => ipcRenderer.invoke('update-case-sync', id),
  insertOrUpdateCases: (data: Client[]) => ipcRenderer.invoke('insert-or-update-cases', data),

})

contextBridge.exposeInMainWorld('admin',{
  // Admin
  deleteUser: (userId: string) => ipcRenderer.invoke('admin:delete-user', userId),
})