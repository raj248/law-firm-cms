import { app, BrowserWindow, ipcMain, shell } from "electron";
import { createRequire } from "node:module";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "node:url";
import path$1 from "node:path";
const require2 = createRequire(import.meta.url);
const Database = require2("better-sqlite3");
console.log("App Name : ", app.getName());
const dbPath = path.join("./database", "lawfirm.db");
console.log("Databse Path : ", dbPath);
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);
db.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    address TEXT,
    notes TEXT,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS cases (
    id TEXT PRIMARY KEY,
    clientId TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT CHECK(status IN ('Open', 'Closed', 'Pending')) NOT NULL,
    court TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    tags TEXT,
    updatedAt TEXT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      clientId TEXT NOT NULL,
      caseId TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      notes TEXT,
      updatedAt TEXT NOT NULL
      );
  `);
const insertClient = (client) => {
  const exists = db.prepare(`SELECT 1 FROM clients WHERE phone = ? OR email = ?`).get(client.phone, client.email);
  if (exists) {
    return { success: false, error: "Client with same phone or email already exists." };
  }
  const stmt = db.prepare(`
    INSERT INTO clients 
    (id, name, phone, email, address, updatedAt) 
    VALUES (@id, @name, @phone, @email, @address, @updatedAt)
  `);
  stmt.run({
    id: client.id,
    name: client.name,
    phone: client.phone,
    email: client.email,
    address: client.address ?? "",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  return { success: true };
};
const getAllClients = () => {
  return db.prepare(`SELECT * FROM clients`).all();
};
const deleteClient = (id) => {
  db.prepare(`DELETE FROM clients WHERE id = ?`).run(id);
};
const insertCase = (legalCase) => {
  const exists = db.prepare(`SELECT 1 FROM cases WHERE id = ?`).get(legalCase.id);
  if (exists) {
    return { success: false, error: "Case with same CadeID already exists." };
  }
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO cases
    (id, title, description, status, clientId, court, createdAt, tags, updatedAt)
    VALUES (@id, @title, @description, @status, @clientId, @court, @createdAt, @tags, @updatedAt)
  `);
  stmt.run({
    ...legalCase,
    tags: JSON.stringify(legalCase.tags ?? []),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  return { success: true };
};
const getAllCases = () => {
  return db.prepare(`SELECT * FROM cases`).all();
};
const getCasesByClient = (clientId) => {
  return db.prepare(`SELECT * FROM cases WHERE clientId = ?`).all(clientId);
};
const deleteCase = (id) => {
  db.prepare(`DELETE FROM cases WHERE id = ?`).run(id);
};
const insertTask = (task) => {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO tasks
    (id, title, date, time, clientId, caseId, notes, updatedAt)
    VALUES (@id, @title, @date, @time, @clientId, @caseId, @notes, @updatedAt)
  `);
  stmt.run({
    ...task,
    notes: task.notes ?? "",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  });
};
const getAllTasks = () => {
  return db.prepare(`SELECT * FROM tasks`).all();
};
const getTasksByClient = (clientId) => {
  return db.prepare(`SELECT * FROM tasks WHERE clientId = ?`).all(clientId);
};
const deleteTask = (id) => {
  db.prepare(`DELETE FROM tasks WHERE id = ?`).run(id);
};
createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path$1.dirname(__filename);
process.env.APP_ROOT = path$1.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path$1.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path$1.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path$1.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
function createWindow() {
  win = new BrowserWindow({
    icon: path$1.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path$1.join(__dirname, "preload.mjs")
    }
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path$1.join(RENDERER_DIST, "index.html"));
  }
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(() => {
  createWindow();
  ipcMain.on("log", (_event, ...args) => {
    console.log("\x1B[32m%s\x1B[0m", "[Renderer Log]:", ...args);
  });
  ipcMain.handle("open-file", async (_event, filePath) => {
    return await shell.openPath(filePath);
  });
  ipcMain.handle("database:insert-client", (_event, client) => {
    return insertClient(client);
  });
  ipcMain.handle("database:get-all-clients", () => {
    return getAllClients();
  });
  ipcMain.handle("database:delete-client", (_event, id) => {
    return deleteClient(id);
  });
  ipcMain.handle("database:insert-case", (_event, legalCase) => {
    return insertCase(legalCase);
  });
  ipcMain.handle("database:get-all-cases", () => {
    return getAllCases();
  });
  ipcMain.handle("database:get-cases-by-client", (_event, clientId) => {
    return getCasesByClient(clientId);
  });
  ipcMain.handle("database:delete-case", (_event, id) => {
    return deleteCase(id);
  });
  ipcMain.handle("database:insert-task", (_event, task) => {
    return insertTask(task);
  });
  ipcMain.handle("database:get-all-tasks", () => {
    return getAllTasks();
  });
  ipcMain.handle("database:get-tasks-by-client", (_event, clientId) => {
    return getTasksByClient(clientId);
  });
  ipcMain.handle("database:delete-task", (_event, id) => {
    return deleteTask(id);
  });
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
