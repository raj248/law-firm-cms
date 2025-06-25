import { Client } from '@/types'
import { db } from './db.ts'

export const insertClient = (client: Client): { success: boolean; error?: string; data?: Client } => {
  const exists = db
    .prepare(`SELECT 1 FROM clients WHERE phone = ? OR email = ?`)
    .get(client.phone, client.email)

  if (exists) {
    return { success: false, error: 'Client with same phone or email already exists.' }
  }

  const stmt = db.prepare(`
    INSERT INTO clients 
    (id, name, phone, email, address, updated_at, created_at, note, is_synced) 
    VALUES (@id, @name, @phone, @email, @address, @updated_at, @created_at, @note, @is_synced)
  `)
  const now = new Date().toISOString()
  const newClient = {
    id: client.id,
    name: client.name,
    phone: client.phone,
    email: client.email,
    address: client.address ?? '',
    updated_at: now,
    created_at: now,
    note: client.note?? '',
    is_synced: 0
  } as Client
  const result = stmt.run(newClient)
  if (result.changes === 0) {
      return { success: false, error: 'Insert failed: no rows affected.' }
    }

  return { success: true, data: newClient }
}


export const getAllClients = () => {
  return db.prepare(`SELECT * FROM clients`).all()
}

export const updateClientField = (id: string, field: string, value: string) => {
  const validFields = ["name", "email", "phone", "address", "note"]
  if (!validFields.includes(field)) return false

  const result = db.prepare(`UPDATE clients SET ${field} = ?,  is_synced = 0, WHERE id = ?`).run(value, id)
  console.log("inside Client repo")
  if (result.changes === 0) {
      return { success: false, error: 'Update Failed: No idea what happend.' }
    }

    return { success: true }
}

export const deleteClient = (id: string) => {
  const result = db.prepare(`DELETE FROM clients WHERE id = ?`).run(id)
  if (result.changes === 0) {
      return { success: false, error: 'Delete Failed: No idea what happend.' }
    }

    return { success: true }
}

export const unsyncedClients = () => {
  const result = db.prepare(`
    SELECT * FROM clients WHERE is_synced = 0
  `).all() as Client[]
  return result
}

export const updateClientSync = (id: string) => {
  const updateSyncStmt = db.prepare(`
    UPDATE clients SET is_synced = 1 WHERE id = ?
  `)
  return updateSyncStmt.run(id)
}

export const insertOrUpdateClients  = (data: Client[]) => {
  const insertOrUpdate = db.prepare(`
    INSERT INTO clients (id, name, phone, email, address, note, created_at, updated_at, is_synced)
    VALUES (@id, @name, @phone, @email, @address, @note, @created_at, @updated_at, 1)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      phone = excluded.phone,
      email = excluded.email,
      address = excluded.address,
      note = excluded.note,
      created_at = excluded.created_at,
      updated_at = excluded.updated_at,
      is_synced = 1
  `)
  
  
  const transaction = db.transaction(() => {
    for (const client of data) insertOrUpdate.run(client)
  })

  transaction()
}