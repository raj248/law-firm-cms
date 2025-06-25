import { randomUUID } from 'node:crypto'
import { db } from './db.ts'
import { Court, Tag } from '@/types.ts'

export const getAllCourts = () => {
  const stmt = db.prepare(`SELECT * FROM courts ORDER BY name ASC`)
  return stmt.all()
}

export const getAllTags = () => {
  const stmt = db.prepare(`SELECT * FROM tags ORDER BY name ASC`)
  return stmt.all()
}

export const updateCourtSync = (id: string) => {
  const updateSyncStmt = db.prepare(`
    UPDATE courts SET is_synced = 1 WHERE id = ?
  `)
  updateSyncStmt.run(id)
}

export const updateTagSync = (id: string) => {
  const updateSyncStmt = db.prepare(`
    UPDATE tags SET is_synced = 1 WHERE id = ?
  `)
  updateSyncStmt.run(id)
}

export const unsyncedCourts = () => {
  const result = db.prepare(`
      SELECT * FROM courts WHERE is_synced = 0
    `).all() as Court[]
    return result
}

export const unsyncedTags = () => {
  const result = db.prepare(`
      SELECT * FROM tags WHERE is_synced = 0
    `).all() as Tag[]
    return result
}

export const insertCourt = (name: string, id?: string, is_synced?: number) => {
  const stmt = db.prepare(`
    INSERT INTO courts (id, name, created_at, is_synced)
    VALUES (@id, @name, @created_at, @is_synced)
    ON CONFLICT(name) DO NOTHING
  `);

  const tag = {
    id: id? id :randomUUID(),
    name,
    created_at: new Date().toISOString(),
    is_synced: is_synced? is_synced: 0,
  };

  const result = stmt.run(tag);
  return result.changes > 0
};

export const insertTag = (name: string, id?: string, is_synced?: number) => {
  const stmt = db.prepare(`
    INSERT INTO tags (id, name, created_at, is_synced)
    VALUES (@id, @name, @created_at, @is_synced)
    ON CONFLICT(name) DO NOTHING
  `);

  const tag = {
    id: id? id :randomUUID(),
    name,
    created_at: new Date().toISOString(),
    is_synced: is_synced? is_synced: 0,
  };

  const result = stmt.run(tag);
  return result.changes > 0
};