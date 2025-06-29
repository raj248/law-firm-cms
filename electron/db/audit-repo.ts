import { Audit } from "@/types.ts";
import { db } from "./db.ts"


// INSERT AUDIT WITH AUTO CLEANUP
export const insertAudit = (audit: Audit): { success: boolean; error?: string; data?: Audit } => {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO audits 
    (id, created_at, user_id, user_name, action_type, object_type, object_id, object_name, is_synced)
    VALUES (@id, @created_at, @user_id, @user_name, @action_type, @object_type, @object_id, @object_name, @is_synced)
  `)

  const result = stmt.run(audit)

  if (result.changes === 0) {
    return { success: false, error: "Upsert failed: no rows affected." }
  }

  // CLEANUP: Keep max 300 rows
  db.prepare(`
    DELETE FROM audits
    WHERE id IN (
      SELECT id FROM audits
      ORDER BY created_at ASC
      LIMIT (SELECT COUNT(*) FROM audits) - 300
    )
    AND (SELECT COUNT(*) FROM audits) > 300
  `).run()

  return { success: true, data: audit }
}


// GET ALL AUDITS
export const getAllAudits = (): Audit[] => {
  return db.prepare(`SELECT * FROM audits ORDER BY created_at DESC`).all() as Audit[]
}

// GET UNSYNCED AUDITS
export const unsyncedAudits = (): Audit[] => {
  return db.prepare(`SELECT * FROM audits WHERE is_synced = 0`).all() as Audit[]
}

// MARK AUDIT AS SYNCED
export const updateAuditSync = (id: string): { success: boolean; error?: string } => {
  const stmt = db.prepare(`UPDATE audits SET is_synced = 1 WHERE id = ?`)
  const result = stmt.run(id)

  if (result.changes === 0) {
    return { success: false, error: "Update failed: Audit not found." }
  }
  return { success: true }
}
