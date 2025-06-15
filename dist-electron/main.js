import { app, BrowserWindow, ipcMain, shell } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createRequire } from "node:module";
const require2 = createRequire(import.meta.url);
const Database = require2("better-sqlite3");
function db() {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const mockClients = [
    {
      id: "c1",
      name: "Alice Sharma",
      phone: "9876543210",
      email: "alice@example.com",
      address: "123 Civil Lines",
      notes: "Prefers email communication",
      updatedAt: now
    },
    {
      id: "c2",
      name: "Bob Verma",
      phone: "9123456780",
      email: "bob@example.com",
      address: "45 MG Road",
      notes: "",
      updatedAt: now
    }
  ];
  const database = new Database("lawfirm.db");
  console.log("Database successfully created");
  database.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    address TEXT,
    notes TEXT,
    updatedAt TEXT NOT NULL);
    `);
  const insertClient = database.prepare(`
    INSERT OR REPLACE INTO clients (id, name, phone, email, address, notes, updatedAt)
    VALUES (@id, @name, @phone, @email, @address, @notes, @updatedAt)
  `);
  mockClients.forEach((client) => insertClient.run(client));
  const result = database.prepare(`SELECT * FROM clients`).all();
  console.log(result);
}
createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs")
    }
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
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
  ipcMain.handle("open-file", async (_event, filePath) => {
    const result = await shell.openPath(filePath);
    return result;
  });
  ipcMain.handle("db-test", () => {
    db();
  });
}).catch((err) => {
  console.error("Electron app launch failed:", err);
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
