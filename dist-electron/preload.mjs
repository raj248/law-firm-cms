"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args) {
    const [channel, listener] = args;
    return electron.ipcRenderer.on(channel, (event, ...args2) => listener(event, ...args2));
  },
  off(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.off(channel, ...omit);
  },
  send(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.send(channel, ...omit);
  },
  invoke(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.invoke(channel, ...omit);
  }
});
electron.contextBridge.exposeInMainWorld("electronUpdater", {
  onUpdateAvailable: (cb) => electron.ipcRenderer.on("update_available", cb),
  onDownloadProgress: (cb) => electron.ipcRenderer.on("update_download_progress", cb),
  onUpdateDownloaded: (cb) => electron.ipcRenderer.on("update_downloaded", cb),
  restartApp: () => electron.ipcRenderer.send("restart_app")
});
electron.contextBridge.exposeInMainWorld("debug", {
  log: (...args) => electron.ipcRenderer.send("log", ...args)
});
electron.contextBridge.exposeInMainWorld("electronAPI", {
  openFile: (filePath) => electron.ipcRenderer.invoke("open-file", filePath),
  appReady: () => electron.ipcRenderer.send("app-ready"),
  getAppVersion: () => electron.ipcRenderer.invoke("get-app-version"),
  checkForUpdates: () => electron.ipcRenderer.invoke("check-for-update"),
  saveTempFile: (fileName, buffer) => electron.ipcRenderer.invoke("save-temp-file", fileName, buffer)
});
electron.contextBridge.exposeInMainWorld("database", {
  // Clients
  insertClient: (client) => electron.ipcRenderer.invoke("database:insert-client", client),
  getAllClients: () => electron.ipcRenderer.invoke("database:get-all-clients"),
  deleteClient: (id) => electron.ipcRenderer.invoke("database:delete-client", id),
  updateClientField: (id, field, value) => electron.ipcRenderer.invoke("database:update-client-field", id, field, value),
  // Cases
  insertCase: (legalCase) => electron.ipcRenderer.invoke("database:insert-case", legalCase),
  getAllCases: () => electron.ipcRenderer.invoke("database:get-all-cases"),
  getCasesByClient: (client_id) => electron.ipcRenderer.invoke("database:get-cases-by-client", client_id),
  deleteCase: (id) => electron.ipcRenderer.invoke("database:delete-case", id),
  updateCase: (id, field, value) => electron.ipcRenderer.invoke("database:update-case", id, field, value),
  // Tasks
  insertTask: (task) => electron.ipcRenderer.invoke("database:insert-task", task),
  getAllTasks: () => electron.ipcRenderer.invoke("database:get-all-tasks"),
  getTasksByClient: (client_id) => electron.ipcRenderer.invoke("database:get-tasks-by-client", client_id),
  updateTask: (task) => electron.ipcRenderer.invoke("database:update-task", task),
  deleteTask: (id) => electron.ipcRenderer.invoke("database:delete-task", id),
  // Settings
  getAllCourts: () => electron.ipcRenderer.invoke("get-courts"),
  getAllTags: () => electron.ipcRenderer.invoke("get-tags"),
  unsyncedCourts: () => electron.ipcRenderer.invoke("unsynced-courts"),
  unsyncedTags: () => electron.ipcRenderer.invoke("unsynced-tags"),
  insertCourt: (name, id, is_synced) => electron.ipcRenderer.invoke("insert-court", name, id, is_synced),
  insertTag: (name, id, is_synced) => electron.ipcRenderer.invoke("insert-tag", name, id, is_synced),
  updateCourtSync: (id) => electron.ipcRenderer.invoke("update-court-sync", id),
  updateTagSync: (id) => electron.ipcRenderer.invoke("update-tag-sync", id),
  // Sync
  unsyncedClients: () => electron.ipcRenderer.invoke("unsynced-clients"),
  updateClientSync: (id) => electron.ipcRenderer.invoke("update-client-sync", id),
  insertOrUpdateClients: (data) => electron.ipcRenderer.invoke("insert-or-update-clients", data),
  unsyncedCases: () => electron.ipcRenderer.invoke("unsynced-cases"),
  updateCaseSync: (id) => electron.ipcRenderer.invoke("update-case-sync", id),
  insertOrUpdateCases: (data) => electron.ipcRenderer.invoke("insert-or-update-cases", data)
});
electron.contextBridge.exposeInMainWorld("admin", {
  // Admin
  deleteUser: (userId) => electron.ipcRenderer.invoke("admin:delete-user", userId)
});
