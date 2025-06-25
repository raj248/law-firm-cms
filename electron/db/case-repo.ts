import { Case } from '@/types'
import { db } from './db.ts'

export const insertCase = (legalCase: Case) : { success: boolean; error?: string; data?: Case }=> {
  const exists = db
    .prepare(`SELECT 1 FROM cases WHERE id = ?`)
    .get(legalCase.id)

  if (exists) {
    return { success: false, error: 'Case with same CaseID already exists.' }
  }

  const stmt = db.prepare(`
    INSERT INTO cases
    (id, title, description, status, client_id, court, created_at, tags, updated_at, is_synced)
    VALUES (@id, @title, @description, @status, @client_id, @court, @created_at, @tags, @updated_at, @is_synced)
  `)
  const newCase = {
    ...legalCase,
    tags: JSON.stringify(legalCase.tags ?? []),
    updated_at: new Date().toISOString(),
    is_synced: 0,
  } 
  const result = stmt.run(newCase)

  if (result.changes === 0) {
      return { success: false, error: 'Insert failed: no rows affected.' }
    }

  return { success: true, data: {...newCase, tags:legalCase.tags??[]} }
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
  const updated_at = new Date().toISOString()

  const stmt = db.prepare(`
    UPDATE cases
    SET ${field} = ?, updated_at = ?, is_synced = 0,
    WHERE id = ?
  `)

  const result = stmt.run(
    isTags ? JSON.stringify(value) : value,
    updated_at,
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

export const unsyncedCases = () => {
  const result = db.prepare(`
    SELECT * FROM cases WHERE is_synced = 0
  `).all() as Case[]
  return result
}

export const updateCaseSync = (id: string) => {
  const updateSyncStmt = db.prepare(`
    UPDATE cases SET is_synced = 1 WHERE id = ?
  `)
  return updateSyncStmt.run(id)
}

export const insertOrUpdateCases = (data: Case[]) => {
  const insertOrUpdate = db.prepare(`
    INSERT INTO cases (id, title, description, status, client_id, court, tags, created_at, updated_at, is_synced)
    VALUES (@id, @title, @description, @status, @client_id, @court, @tags, @created_at, @updated_at, 1)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      description = excluded.description,
      status = excluded.status,
      client_id = excluded.client_id,
      court = excluded.court,
      tags = excluded.tags,
      created_at = excluded.created_at,
      updated_at = excluded.updated_at,
      is_synced = 1
  `)

  const transaction = db.transaction(() => {
    for (const kase of data) insertOrUpdate.run({
      ...kase,
      client_id: kase.client_id,
      tags: kase.tags ?? '', // store tags as JSON string
    })
  })

  transaction()
}
