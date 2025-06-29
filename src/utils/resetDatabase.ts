// utils/resetDatabase.ts
import { app } from 'electron'
import fs from 'fs'
import path from 'path'

export function resetDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'LawFirmApp', 'database', 'lawfirm.db')

  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath)
    console.log('✅ Local database deleted.')
  } else {
    console.log('⚠️ No local database found to delete.')
  }
}
