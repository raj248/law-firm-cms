export {}

declare global {
  interface Window {
    ipcRenderer: {
      on: typeof ipcRenderer.on
      off: typeof ipcRenderer.off
      send: typeof ipcRenderer.send
      invoke: typeof ipcRenderer.invoke
    }
    electronAPI: {
      openFile: (filePath: string) => Promise<string>
    }
  }
}
