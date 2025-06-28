import { app, BrowserWindow, ipcMain, shell } from 'electron'

import { insertClient, getAllClients, deleteClient, updateClientField, unsyncedClients, updateClientSync, insertOrUpdateClients } from './db/client-repo.ts'
import { insertCase, getAllCases, deleteCase, updateCase, unsyncedCases, updateCaseSync, insertOrUpdateCases } from './db/case-repo.ts'
import { insertTask, getAllTasks, deleteTask, updateTask } from './db/task-repo.ts'

import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { createRequire } from 'node:module'

import { autoUpdater } from "electron-updater"
import log from "electron-log"
import { getAllCourts, getAllTags, insertCourt, insertTag, unsyncedCourts, unsyncedTags, updateCourtSync, updateTagSync } from './db/settings-repo.ts'
import { deleteUser } from './supabaseAdmin.ts'

import dotenv from 'dotenv'
import { saveTempFile } from './file-handler.ts'
dotenv.config()

const require = createRequire(import.meta.url)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

{require}
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
  
  console.log(path.join(__dirname, 'preload.mjs'))
  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
    // win?.webContents.send('main-process-message', VITE_DEV_SERVER_URL)
  })
  
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    console.log("VITE_DEV_SERVER_URL: ", VITE_DEV_SERVER_URL)
    
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
    console.log("RENDERER_DIST: ", path.join(RENDERER_DIST, 'index.html'))
  }
  win?.setAutoHideMenuBar(true)
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


autoUpdater.logger = log

autoUpdater.on('update-available', (info) => {
  win?.webContents.send('update_available', {
    version: info.version,
    releaseNotes: info.releaseNotes || '',
    releaseName: info.releaseName || '',
  })
})


autoUpdater.on('download-progress', (progressObj) => {
  win?.webContents.send('update_download_progress', progressObj.percent)
})

autoUpdater.on('update-downloaded', () => {
  win?.webContents.send('update_downloaded')
})

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

app.whenReady().then(() => {
  createWindow()

  log.info("App starting...")
  autoUpdater.checkForUpdates()
  
  ipcMain.on('restart_app', () => {
    autoUpdater.quitAndInstall()
  })

  ipcMain.on('log', (_event, ...args) => {
    console.log('\x1b[32m%s\x1b[0m', '[Renderer Log]:', ...args)
  })
  
   // Shell
  ipcMain.handle('open-file', async (_event, filePath: string) => {
    return await shell.openPath(filePath)
  })

  ipcMain.handle('save-temp-file', async (_event, filename, buffer)=>{
    return await saveTempFile(filename, buffer)
  })
  // Clients
  ipcMain.handle('database:insert-client', (_event, client) => {
    return insertClient(client)
  })

  ipcMain.handle('database:get-all-clients', () => {
    return getAllClients()
  })

  ipcMain.handle('database:update-client-field',(_event, id, field, value) => {
    return updateClientField(id, field, value)
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

  ipcMain.handle('database:delete-case', (_event, id: string) => {
    return deleteCase(id)
  })

  ipcMain.handle('database:update-case',(_event, id, field, value)=>{
    return updateCase(id, field, value)
  })

  // Tasks
  ipcMain.handle('database:insert-task', (_event, task) => {
    return insertTask(task)
  })

  ipcMain.handle('database:get-all-tasks', () => {
    return getAllTasks()
  })

  ipcMain.handle('database:delete-task', (_event, id: string) => {
    return deleteTask(id)
  })

  ipcMain.handle('database:update-task', (_event, task) => {
    return updateTask(task)
  })

  ipcMain.handle('get-courts', () => {
    return getAllCourts()
  })

  ipcMain.handle('get-tags', () => {
    return getAllTags()
  })

  ipcMain.handle('insert-court', (_event, name, id, is_synced) => {
    return insertCourt(name, id, is_synced)
  })

  ipcMain.handle('insert-tag', (_event, name, id, is_synced) => {
    return insertTag(name, id, is_synced)
  })

  ipcMain.handle('update-court-sync', (_event, id) => {
    return updateCourtSync(id)
  })

  ipcMain.handle('update-tag-sync', (_event, id) => {
    return updateTagSync(id)
  })

  ipcMain.handle('unsynced-courts', ()=>{
    return unsyncedCourts()
  })

  ipcMain.handle('unsynced-tags', ()=>{
    return unsyncedTags()
  })

  ipcMain.handle('unsynced-clients', ()=>{
    return unsyncedClients()
  })

  ipcMain.handle('update-client-sync', (_event, id)=>{
    return updateClientSync(id)
  })

  ipcMain.handle('insert-or-update-clients', (_event, data)=>{
    return insertOrUpdateClients(data)
  })

  ipcMain.handle('unsynced-cases', ()=>{
    return unsyncedCases()
  })

  ipcMain.handle('update-case-sync', (_event, id)=>{
    return updateCaseSync(id)
  })

  ipcMain.handle('insert-or-update-cases', (_event, data)=>{
    return insertOrUpdateCases(data)
  })

  ipcMain.handle('admin:delete-user', async (_event, userId: string) => {
  // const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
  const result  = await deleteUser(userId)
  console.log(result)
  return result
})
})


// dialog.showMessageBox({
//       type: 'info',
//       title: 'currentVersion',
//       message: app.getVersion(),
//       detail: 'This is the current version.',
//       buttons: ['OK']
//     })