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
    note TEXT,
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
    dueDate TEXT, -- ISO date (nullable if no due date)
    time TEXT, -- optional time
    clientId TEXT NOT NULL,
    caseId TEXT NOT NULL,
    note TEXT,
    status TEXT CHECK(status IN ('Open', 'Closed', 'Pending')) NOT NULL DEFAULT 'Open',
    priority TEXT CHECK(priority IN ('Low', 'Medium', 'High')) NOT NULL DEFAULT 'Medium',
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
    (id, name, phone, email, address, updatedAt, note) 
    VALUES (@id, @name, @phone, @email, @address, @updatedAt, @note)
  `);
  const result = stmt.run({
    id: client.id,
    name: client.name,
    phone: client.phone,
    email: client.email,
    address: client.address ?? "",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    note: client.note ?? ""
  });
  if (result.changes === 0) {
    return { success: false, error: "Insert failed: no rows affected." };
  }
  return { success: true };
};
const getAllClients = () => {
  return db.prepare(`SELECT * FROM clients`).all();
};
const updateClientField = (id, field, value) => {
  const validFields = ["name", "email", "phone", "address", "notes"];
  if (!validFields.includes(field)) return false;
  const result = db.prepare(`UPDATE clients SET ${field} = ? WHERE id = ?`).run(value, id);
  console.log("inside Client repo");
  if (result.changes === 0) {
    return { success: false, error: "Update Failed: No idea what happend." };
  }
  return { success: true };
};
const deleteClient = (id) => {
  const result = db.prepare(`DELETE FROM clients WHERE id = ?`).run(id);
  if (result.changes === 0) {
    return { success: false, error: "Delete Failed: No idea what happend." };
  }
  return { success: true };
};
const insertCase = (legalCase) => {
  const exists = db.prepare(`SELECT 1 FROM cases WHERE id = ?`).get(legalCase.id);
  if (exists) {
    return { success: false, error: "Case with same CaseID already exists." };
  }
  const stmt = db.prepare(`
    INSERT INTO cases
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
const updateCase = (id, field, value) => {
  const exists = db.prepare(`SELECT 1 FROM cases WHERE id = ?`).get(id);
  if (!exists) return { success: false, error: "Case not found" };
  const isTags = field === "tags";
  const updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  const stmt = db.prepare(`
    UPDATE cases
    SET ${field} = ?, updatedAt = ?
    WHERE id = ?
  `);
  const result = stmt.run(
    isTags ? JSON.stringify(value) : value,
    updatedAt,
    id
  );
  if (!result.changes) return { success: false, error: "Update failed: No idea what happend." };
  const modifiedCase = db.prepare(`SELECT * FROM cases WHERE id = ?`).get(id);
  const castCase = (c) => ({
    ...c,
    tags: c.tags ? JSON.parse(c.tags) : []
  });
  return { success: true, updatedCase: castCase(modifiedCase) };
};
const deleteCase = (id) => {
  const result = db.prepare(`DELETE FROM cases WHERE id = ?`).run(id);
  if (result.changes === 0) {
    return { success: false, error: "Delete Failed: No idea what happend." };
  }
  return { success: true };
};
const insertTask = (task) => {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO tasks
    (id, title, dueDate, time, clientId, caseId, status, priority, note, updatedAt)
    VALUES (@id, @title, @dueDate, @time, @clientId, @caseId, @status, @priority, @note, @updatedAt)
  `);
  const result = stmt.run({
    ...task,
    note: task.note ?? "",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  if (result.changes === 0) {
    return { success: false, error: "Insert failed: no rows affected." };
  }
  return { success: true };
};
const getAllTasks = () => {
  return db.prepare(`SELECT * FROM tasks`).all();
};
const deleteTask = (id) => {
  const result = db.prepare(`DELETE FROM tasks WHERE id = ?`).run(id);
  if (result.changes === 0) {
    return { success: false, error: "Delete Failed: No idea what happend." };
  }
  return { success: true };
};
const updateTask = (task) => {
  const stmt = db.prepare(`
    UPDATE tasks
    SET 
      title = @title,
      dueDate = @dueDate,
      time = @time,
      clientId = @clientId,
      caseId = @caseId,
      note = @note,
      status = @status,
      priority = @priority,
      updatedAt = @updatedAt
    WHERE id = @id
  `);
  const result = stmt.run({
    ...task,
    note: task.note ?? "",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  if (result.changes === 0) {
    return { success: false, error: "Update failed: No such task found (or i have no idea what happend)." };
  }
  return { success: true };
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
  ipcMain.handle("database:update-client-field", (_event, id, field, value) => {
    return updateClientField(id, field, value);
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
  ipcMain.handle("database:delete-case", (_event, id) => {
    return deleteCase(id);
  });
  ipcMain.handle("database:update-case", (_event, id, field, value) => {
    return updateCase(id, field, value);
  });
  ipcMain.handle("database:insert-task", (_event, task) => {
    return insertTask(task);
  });
  ipcMain.handle("database:get-all-tasks", () => {
    return getAllTasks();
  });
  ipcMain.handle("database:delete-task", (_event, id) => {
    return deleteTask(id);
  });
  ipcMain.handle("database:update-task", (_event, task) => {
    return updateTask(task);
  });
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
