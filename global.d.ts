export {}

declare global {
  interface Window {
      electronAPI: {
      openFile: (filePath: string) => Promise<string>
      getAppVersion: () => Promise<string>
    }
  }
}
