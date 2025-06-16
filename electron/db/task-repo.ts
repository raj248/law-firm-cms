import { Task } from '@/types'
import { db } from './db.ts'

export const insertTask = (task: Task) => {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO tasks
    (id, title, date, time, clientId, caseId, notes, updatedAt)
    VALUES (@id, @title, @date, @time, @clientId, @caseId, @notes, @updatedAt)
  `)

  stmt.run({
    ...task,
    notes: task.notes ?? '',
    updatedAt: new Date().toISOString(),
  })
}

export const getAllTasks = () => {
  return db.prepare(`SELECT * FROM tasks`).all()
}

export const getTasksByClient = (clientId: string) => {
  return db.prepare(`SELECT * FROM tasks WHERE clientId = ?`).all(clientId)
}

export const deleteTask = (id: string) => {
  db.prepare(`DELETE FROM tasks WHERE id = ?`).run(id)
}
