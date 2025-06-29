import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
import { Buffer } from "buffer"
import { app } from 'electron'

const fs = require("fs")
const path = require("path")

export const saveTempFile = (fileName: string, arrayBuffer: ArrayBuffer): string => {
  const buffer = Buffer.from(arrayBuffer)

  const tempDir = path.join(app.getPath('userData'), 'LawFirmApp', 'templates')
  fs.mkdirSync(tempDir, { recursive: true })

  const tempPath = path.join(tempDir, fileName)
  fs.writeFileSync(tempPath, buffer)

  return path.resolve(tempPath)
}
