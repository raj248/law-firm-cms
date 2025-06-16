import { Client, Case, Task } from '@/types'
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

contextBridge.exposeInMainWorld('debug', {
  log: (...args: any[]) => ipcRenderer.send('log', ...args),
})

// --------- Expose shell.openPath ---------
contextBridge.exposeInMainWorld('electronAPI', {
  openFile: (filePath: string) => ipcRenderer.invoke('open-file', filePath),
})

contextBridge.exposeInMainWorld('database', {
  // Clients
  insertClient: (client: Client) => ipcRenderer.invoke('database:insert-client', client),
  getAllClients: (): Promise<Client[]> => ipcRenderer.invoke('database:get-all-clients'),
  deleteClient: (id: string) => ipcRenderer.invoke('database:delete-client', id),

  // Cases
  insertCase: (legalCase: Case) => ipcRenderer.invoke('database:insert-case', legalCase),
  getAllCases: (): Promise<Case[]> => ipcRenderer.invoke('database:get-all-cases'),
  getCasesByClient: (clientId: string): Promise<Case[]> =>
    ipcRenderer.invoke('database:get-cases-by-client', clientId),
  deleteCase: (id: string) => ipcRenderer.invoke('database:delete-case', id),

  // Tasks
  insertTask: (task: Task) => ipcRenderer.invoke('database:insert-task', task),
  getAllTasks: (): Promise<Task[]> => ipcRenderer.invoke('database:get-all-tasks'),
  getTasksByClient: (clientId: string): Promise<Task[]> =>
    ipcRenderer.invoke('database:get-tasks-by-client', clientId),
  deleteTask: (id: string) => ipcRenderer.invoke('database:delete-task', id)
})
