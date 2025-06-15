// import { Client } from '@/types'
// import { db } from './db.ts'

// export const insertClient = (client: Client) => {
//   const stmt = db?.prepare(`
//     INSERT OR REPLACE INTO clients 
//     (id, name, phone, email, address, updatedAt) 
//     VALUES (@id, @name, @phone, @email, @address, @updatedAt)
//   `)

//   stmt?.run({
//     id: client.id,
//     name: client.name,
//     phone: client.phone,
//     email: client.email,
//     address: client.address ?? '',
//     updatedAt: new Date().toISOString()
//   })
// }


// export const getAllClients = () => {
//   return db?.prepare(`SELECT * FROM clients`).all()
// }

// export const deleteClient = (id: string) => {
//   db?.prepare(`DELETE FROM clients WHERE id = ?`).run(id)
// }
