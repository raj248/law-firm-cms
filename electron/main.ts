import { app, BrowserWindow, ipcMain, shell } from 'electron'

import { insertClient, getAllClients, deleteClient } from './db/client-repo.ts'
import { insertCase, getAllCases, getCasesByClient, deleteCase } from './db/case-repo.ts'
import { insertTask, getAllTasks, getTasksByClient, deleteTask } from './db/task-repo.ts'

import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  createWindow()

  ipcMain.on('log', (_event, ...args) => {
    console.log('\x1b[32m%s\x1b[0m', '[Renderer Log]:', ...args)
  })

  // Shell
  ipcMain.handle('open-file', async (_event, filePath: string) => {
    return await shell.openPath(filePath)
  })

  // Clients
  ipcMain.handle('database:insert-client', (_event, client) => {
    return insertClient(client)
  })

  ipcMain.handle('database:get-all-clients', () => {
    return getAllClients()
  })

  ipcMain.handle('database:delete-client', (_event, id: string) => {
    return deleteClient(id)
  })

  // Cases
  ipcMain.handle('database:insert-case', (_event, legalCase) => {
    return insertCase(legalCase)
  })

  ipcMain.handle('database:get-all-cases', () => {
    return getAllCases()
  })

  ipcMain.handle('database:get-cases-by-client', (_event, clientId: string) => {
    return getCasesByClient(clientId)
  })

  ipcMain.handle('database:delete-case', (_event, id: string) => {
    return deleteCase(id)
  })

  // Tasks
  ipcMain.handle('database:insert-task', (_event, task) => {
    return insertTask(task)
  })

  ipcMain.handle('database:get-all-tasks', () => {
    return getAllTasks()
  })

  ipcMain.handle('database:get-tasks-by-client', (_event, clientId: string) => {
    return getTasksByClient(clientId)
  })

  ipcMain.handle('database:delete-task', (_event, id: string) => {
    return deleteTask(id)
  })
})