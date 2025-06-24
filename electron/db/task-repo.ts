import { Task } from '@/types'
import { db } from './db.ts'

export const insertTask = (task: Task) => {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO tasks
    (id, title, dueDate, time, clientId, caseId, status, priority, note, updated_at, created_at, is_synced)
    VALUES (@id, @title, @dueDate, @time, @clientId, @caseId, @status, @priority, @note, @updated_at, @created_at, @is_synced)
  `)
  const now = new Date().toISOString()
  const result = stmt.run({
    ...task,
    note: task.note ?? '',
    updated_at: now,
    created_at: now,
    is_synced: 0
  })
  if (result.changes === 0) {
      return { success: false, error: 'Insert failed: no rows affected.' }
    }

    return { success: true }
}

export const getAllTasks = () => {
  return db.prepare(`SELECT * FROM tasks`).all()
}

export const deleteTask = (id: string) => {
  const result = db.prepare(`DELETE FROM tasks WHERE id = ?`).run(id)
  if (result.changes === 0) {
      return { success: false, error: 'Delete Failed: No idea what happend.' }
    }

    return { success: true }
}

export const updateTask = (task: Task): { success: boolean; error?: string } => {
  const stmt = db.prepare(`
    UPDATE tasks
    SET 
      title = @title,
      dueDate = @dueDate,
      time = @time,
      clientId = @clientId,
      caseId = @caseId,
      note = @note,
      status = @status,
      priority = @priority,
      updated_at = @updated_at,
      is_synced = @is_synced,
    WHERE id = @id
  `)

  const result = stmt.run({
    ...task,
    note: task.note ?? '',
    updated_at: new Date().toISOString(),
    is_synced: 0,
  })

  if (result.changes === 0) {
    return { success: false, error: 'Update failed: No such task found (or i have no idea what happend).' }
  }

  return { success: true }
  
}