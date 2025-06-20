import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)

const Database = require("better-sqlite3")
import path from 'path'
import fs from 'fs'
import { app } from 'electron'


// const dbPath = path.join(app.getPath('userData'), 'lawfirm.db')
console.log('App Name : ',app.getName())
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
`)
