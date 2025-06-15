// import Database from 'better-sqlite3'
// import path from 'path'
// import fs from 'fs'
// import { app } from 'electron'


// const dbPath = path.join(app.getPath('userData'), 'lawfirm.db')
// console.log(dbPath)
// // Ensure folder exists
// fs.mkdirSync(path.dirname(dbPath), { recursive: true })

// export const db = new Database(dbPath)

// // Create tables if not exists
// db.exec(`
//   CREATE TABLE IF NOT EXISTS clients (
//     id TEXT PRIMARY KEY,
//     name TEXT NOT NULL,
//     phone TEXT NOT NULL,
//     email TEXT NOT NULL,
//     address TEXT,
//     notes TEXT,
//     updatedAt TEXT NOT NULL
//   );

//   CREATE TABLE IF NOT EXISTS cases (
//     id TEXT PRIMARY KEY,
//     clientId TEXT NOT NULL,
//     title TEXT NOT NULL,
//     description TEXT NOT NULL,
//     status TEXT CHECK(status IN ('Open', 'Closed', 'Pending')) NOT NULL,
//     court TEXT NOT NULL,
//     createdAt TEXT NOT NULL,
//     tags TEXT,
//     updatedAt TEXT NOT NULL
//   );

//   CREATE TABLE IF NOT EXISTS appointments (
//     id TEXT PRIMARY KEY,
//     title TEXT NOT NULL,
//     clientId TEXT NOT NULL,
//     caseId TEXT NOT NULL,
//     date TEXT NOT NULL,
//     time TEXT NOT NULL,
//     notes TEXT,
//     updatedAt TEXT NOT NULL
//   );
// `)

// import Database from "better-sqlite3"
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)

const Database = require("better-sqlite3")

export default function db() {
  const now = new Date().toISOString()
  const mockClients = [
    {
      id: 'c1',
      name: 'Alice Sharma',
      phone: '9876543210',
      email: 'alice@example.com',
      address: '123 Civil Lines',
      notes: 'Prefers email communication',
      updatedAt: now
    },
    {
      id: 'c2',
      name: 'Bob Verma',
      phone: '9123456780',
      email: 'bob@example.com',
      address: '45 MG Road',
      notes: '',
      updatedAt: now
    }
  ]
  const database = new Database("lawfirm.db")
  console.log("Database successfully created")
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
  `)
  mockClients.forEach(client => insertClient.run(client))
  const result = database.prepare(`SELECT * FROM clients`).all()
  console.log(result)
}
