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
electron.contextBridge.exposeInMainWorld("electronAPI", {
  openFile: (filePath) => electron.ipcRenderer.invoke("open-file", filePath)
});
electron.contextBridge.exposeInMainWorld("db", {
  addClient: (client) => electron.ipcRenderer.invoke("db:add-client", client),
  getClients: async () => await electron.ipcRenderer.invoke("db:get-clients"),
  dbTest: async () => await electron.ipcRenderer.invoke("db-test")
});
