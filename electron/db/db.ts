import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const Database = require("better-sqlite3");
import path from 'path';
import fs from 'fs';
import { app } from 'electron';

// Ensure Electron app is ready before calling app.getPath
console.log('App Name:', app.getName());

const dbPath = path.join(app.getPath('userData'), 'LawFirmApp', 'database', 'lawfirm.db')

console.log("Database Path:", dbPath);

// Ensure folder exists
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

// Initialize DB
export const db = new Database(dbPath);

// Create tables if not exist
db.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    email TEXT,
    address TEXT,
    note TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    is_synced INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS cases (
    file_id TEXT PRIMARY KEY,
    case_id TEXT,
    client_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT CHECK(status IN ('Open', 'Closed', 'Pending')) NOT NULL,
    court TEXT NOT NULL,
    tags TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    is_synced INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    note TEXT,
    status TEXT CHECK(status IN ('Open', 'Closed', 'Pending', 'Deffered')) NOT NULL DEFAULT 'Open',
    priority TEXT CHECK(priority IN ('Low', 'Medium', 'High', 'Urgent')) NOT NULL DEFAULT 'Medium',
    dueDate TEXT,
    caseId TEXT,
    client_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    is_synced INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS courts (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    created_at TEXT NOT NULL,
    is_synced INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    created_at TEXT NOT NULL,
    is_synced INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS audits (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    user_id TEXT DEFAULT '',
    user_name TEXT DEFAULT '',
    action_type TEXT DEFAULT '',
    object_type TEXT DEFAULT '',
    object_id TEXT DEFAULT '',
    is_synced INTEGER DEFAULT 0
  );
`);
