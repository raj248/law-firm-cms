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
    (id, name, phone, email, address, updatedAt) 
    VALUES (@id, @name, @phone, @email, @address, @updatedAt)
  `)

  stmt.run({
    id: client.id,
    name: client.name,
    phone: client.phone,
    email: client.email,
    address: client.address ?? '',
    updatedAt: new Date().toISOString()
  })

  return { success: true }
}


export const getAllClients = () => {
  return db.prepare(`SELECT * FROM clients`).all()
}

export const deleteClient = (id: string) => {
  const result = db.prepare(`DELETE FROM clients WHERE id = ?`).run(id)
  return result.changes? true : false
}
