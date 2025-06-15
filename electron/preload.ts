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

// --------- Expose shell.openPath ---------
contextBridge.exposeInMainWorld('electronAPI', {
  openFile: (filePath: string) => ipcRenderer.invoke('open-file', filePath),
})

contextBridge.exposeInMainWorld('db', {
  addClient: (client:any) => ipcRenderer.invoke('db:add-client', client),
  getClients: async () => await ipcRenderer.invoke('db:get-clients'),
  dbTest: async () => await ipcRenderer.invoke('db-test'),
})
