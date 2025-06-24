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
electron.contextBridge.exposeInMainWorld("debug", {
  log: (...args) => electron.ipcRenderer.send("log", ...args)
});
electron.contextBridge.exposeInMainWorld("electronAPI", {
  openFile: (filePath) => electron.ipcRenderer.invoke("open-file", filePath),
  checkForUpdates: () => electron.ipcRenderer.invoke("check-for-update")
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
  getCasesByClient: (clientId) => electron.ipcRenderer.invoke("database:get-cases-by-client", clientId),
  deleteCase: (id) => electron.ipcRenderer.invoke("database:delete-case", id),
  updateCase: (id, field, value) => electron.ipcRenderer.invoke("database:update-case", id, field, value),
  // Tasks
  insertTask: (task) => electron.ipcRenderer.invoke("database:insert-task", task),
  getAllTasks: () => electron.ipcRenderer.invoke("database:get-all-tasks"),
  getTasksByClient: (clientId) => electron.ipcRenderer.invoke("database:get-tasks-by-client", clientId),
  deleteTask: (id) => electron.ipcRenderer.invoke("database:delete-task", id),
  // Sync
  unsyncedClients: () => electron.ipcRenderer.invoke("unsynced-clients"),
  updateClientSync: (id) => electron.ipcRenderer.invoke("update-client-sync", id)
});
