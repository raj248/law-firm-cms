import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createRequire } from 'node:module';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import dotenv from 'dotenv';

import {
  insertClient, getAllClients, deleteClient, updateClientField, unsyncedClients, updateClientSync, insertOrUpdateClients
} from './db/client-repo.ts';
import {
  insertCase, getAllCases, deleteCase, updateCase, unsyncedCases, updateCaseSync, insertOrUpdateCases
} from './db/case-repo.ts';
import {
  insertTask, getAllTasks, deleteTask, updateTask
} from './db/task-repo.ts';
import {
  insertAudit, getAllAudits, unsyncedAudits, updateAuditSync,
  getAuditById
} from './db/audit-repo.ts';
import {
  deleteCourt,
  deleteTag,
  getAllCourts, getAllTags, insertCourt, insertTag, unsyncedCourts, unsyncedTags, updateCourtSync, updateTagSync
} from './db/settings-repo.ts';
import { saveTempFile } from './file-handler.ts';
import { deleteUser } from './supabaseAdmin.ts';

dotenv.config();

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
{require}
process.env.APP_ROOT = path.join(__dirname, '..');
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');
export const SPLASH_DIST = path.join(process.env.APP_ROOT, 'splash');
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST;

let win: BrowserWindow | null = null;
let splashWin: BrowserWindow | null = null;

autoUpdater.logger = log;
log.transports.file.level = 'debug';

function createSplashWindow() {
  splashWin = new BrowserWindow({
    width: 500,
    height: 300,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    center: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  });

  splashWin.loadFile(path.join(SPLASH_DIST, 'index.html'));
  splashWin.setMenuBarVisibility(false);

  // splashWin.webContents.on('did-fail-load', (_e, code, desc) => {
  //   log.error(`Splash failed: ${desc} (${code})`);
  //   splashWin?.close();
  //   splashWin = null;
  //   win?.show();
  // });

  splashWin.webContents.on('did-finish-load', () => {
    splashWin?.show();
    // if (VITE_DEV_SERVER_URL) splashWin?.webContents.openDevTools({ mode: 'detach' });
  });
}

function createMainWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'icon.svg'),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  });

  win.setAutoHideMenuBar(true);

  // win.webContents.on('did-fail-load', (_e, code, desc) => {
  //   log.error(`Main window failed: ${desc} (${code})`);
  //   win?.loadFile(path.join(RENDERER_DIST, 'index.html'));
  // });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
    // win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'));
    // win.webContents.openDevTools({ mode: 'detach' }); // Uncomment only for debug
  }

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString());
    // Delay splash for 2s to show branding
    setTimeout(() => {
      splashWin?.close();
      splashWin = null;
      win?.show();
      autoUpdater.checkForUpdates();
    }, 2000);
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    win = null;
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

// Auto-Updater Events
autoUpdater.on('update-available', (info) => {
  win?.webContents.send('update_available', {
    version: info.version,
    releaseNotes: info.releaseNotes || '',
    releaseName: info.releaseName || '',
  });
});
autoUpdater.on('download-progress', (progressObj) => {
  win?.webContents.send('update_download_progress', progressObj.percent);
});
autoUpdater.on('update-downloaded', () => {
  win?.webContents.send('update_downloaded');
});

app.whenReady().then(() => {
  log.info("App version:", app.getVersion());
  log.info("App path:", app.getAppPath());
  log.info("User data path:", app.getPath('userData'));

  createSplashWindow();
  createMainWindow();

});

ipcMain.handle('check-update', () => autoUpdater.checkForUpdates)
// IPC
ipcMain.on('restart_app', () => {
  autoUpdater.quitAndInstall();
});
ipcMain.on('log', (_event, ...args) => {
  console.log('\x1b[32m%s\x1b[0m', '[Renderer Log]:', ...args);
});
ipcMain.handle('get-notification-sound-path', ()=> {
    return path.join(app.getAppPath(), 'public', 'sounds', 'new_activity.mp3')
  })
ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('open-file', async (_event, filePath) => await shell.openPath(filePath));
ipcMain.handle('save-temp-file', async (_event, filename, buffer) => {
  return await saveTempFile(filename, buffer);
});

// Add all your existing CRUD ipcMain handles here without change...
// [Clients, Cases, Tasks, Audits, Courts, Tags, User Management]
// ✅ No change needed here unless you want me to optimize further.

// Insert audit
ipcMain.handle('database:insert-audit', (_event, audit) => {
    return insertAudit(audit)
})

// Get all audits
ipcMain.handle('database:get-all-audits', () => {
    return getAllAudits()
})

ipcMain.handle("get-audit-by-id", async (_event, id: string) => {
  return getAuditById(id)
})

// Get unsynced audits
ipcMain.handle('database:get-unsynced-audits', () => {
    return unsyncedAudits()
})

// Update audit sync status
ipcMain.handle('database:update-audit-sync', (_event, id: string) => {
    return updateAuditSync(id)
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

ipcMain.handle('delete-tag', (_event, tagName: string) => {
  return deleteTag(tagName);
});

ipcMain.handle('delete-court', (_event, courtName: string) => {
  return deleteCourt(courtName);
});

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
