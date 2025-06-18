import { Case } from '@/types'
import { db } from './db.ts'

export const insertCase = (legalCase: Case) : { success: boolean; error?: string }=> {
  const exists = db
    .prepare(`SELECT 1 FROM cases WHERE id = ?`)
    .get(legalCase.id)

  if (exists) {
    return { success: false, error: 'Case with same CadeID already exists.' }
  }

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO cases
    (id, title, description, status, clientId, court, createdAt, tags, updatedAt)
    VALUES (@id, @title, @description, @status, @clientId, @court, @createdAt, @tags, @updatedAt)
  `)

  stmt.run({
    ...legalCase,
    tags: JSON.stringify(legalCase.tags ?? []),
    updatedAt: new Date().toISOString(),
  })

  return { success: true }
}

export const getAllCases = () => {
  return db.prepare(`SELECT * FROM cases`).all()
}

export const getCasesByClient = (clientId: string) => {
  return db.prepare(`SELECT * FROM cases WHERE clientId = ?`).all(clientId)
}

export const deleteCase = (id: string) => {
  const result = db.prepare(`DELETE FROM cases WHERE id = ?`).run(id)
  return result.changes? true : false
}
