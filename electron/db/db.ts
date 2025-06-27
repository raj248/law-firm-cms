import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)

const Database = require("better-sqlite3")
import path from 'path'
import fs from 'fs'
import { app } from 'electron'


console.log('App Name : ',app.getName())
// const dbPath = path.join(app.getPath('userData'), 'lawfirm.db')
const dbPath = path.join('./database', 'lawfirm.db')
console.log("Databse Path : ",dbPath)
// Ensure folder exists
fs.mkdirSync(path.dirname(dbPath), { recursive: true })

export const db = new Database(dbPath)

// Create tables if not exists
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
    dueDate TEXT, -- ISO date (nullable if no due date)
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

`)
