import { Case } from '@/types'
import { db } from './db.ts'

export const insertCase = (legalCase: Case) : { success: boolean; error?: string }=> {
  const exists = db
    .prepare(`SELECT 1 FROM cases WHERE id = ?`)
    .get(legalCase.id)

  if (exists) {
    return { success: false, error: 'Case with same CaseID already exists.' }
  }

  const stmt = db.prepare(`
    INSERT INTO cases
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

export const updateCase = (
  id: string,
  field: keyof Case,
  value: any
): { success: boolean; updatedCase?: Case; error?: string } => {
  const exists = db.prepare(`SELECT 1 FROM cases WHERE id = ?`).get(id)
  if (!exists) return { success: false, error: "Case not found" }

  const isTags = field === "tags"
  const updatedAt = new Date().toISOString()

  const stmt = db.prepare(`
    UPDATE cases
    SET ${field} = ?, updatedAt = ?
    WHERE id = ?
  `)

  const result = stmt.run(
    isTags ? JSON.stringify(value) : value,
    updatedAt,
    id
  )

  if (!result.changes) return { success: false, error: "Update failed: No idea what happend." }

  const modifiedCase = db.prepare(`SELECT * FROM cases WHERE id = ?`).get(id)

  const castCase = (c: any): Case => ({
    ...c,
    tags: c.tags ? JSON.parse(c.tags) : [],
  })
  return { success: true, updatedCase: castCase(modifiedCase) }
}


export const deleteCase = (id: string) => {
  const result = db.prepare(`DELETE FROM cases WHERE id = ?`).run(id)
  if (result.changes === 0) {
      return { success: false, error: 'Delete Failed: No idea what happend.' }
    }

    return { success: true }
}