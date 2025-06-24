import { Client } from '@/types'
import { db } from './db.ts'

export const insertClient = (client: Client): { success: boolean; error?: string } => {
  const exists = db
    .prepare(`SELECT 1 FROM clients WHERE phone = ? OR email = ?`)
    .get(client.phone, client.email)

  if (exists) {
    return { success: false, error: 'Client with same phone or email already exists.' }
  }

  const stmt = db.prepare(`
    INSERT INTO clients 
    (id, name, phone, email, address, updated_at, note) 
    VALUES (@id, @name, @phone, @email, @address, @updated_at, @note)
  `)

  const result = stmt.run({
    id: client.id,
    name: client.name,
    phone: client.phone,
    email: client.email,
    address: client.address ?? '',
    updated_at: new Date().toISOString(),
    note: client.note?? ''
  })
  if (result.changes === 0) {
      return { success: false, error: 'Insert failed: no rows affected.' }
    }

    return { success: true }
}


export const getAllClients = () => {
  return db.prepare(`SELECT * FROM clients`).all()
}

export const updateClientField = (id: string, field: string, value: string) => {
  const validFields = ["name", "email", "phone", "address", "notes"]
  if (!validFields.includes(field)) return false

  const result = db.prepare(`UPDATE clients SET ${field} = ? WHERE id = ?`).run(value, id)
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
