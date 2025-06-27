import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
import { Buffer } from "buffer"

const fs = require("fs")
const path = require("path")
import { app } from 'electron'

export const saveTempFile = (fileName: string, arrayBuffer: ArrayBuffer) : string => {
    const buffer = Buffer.from(arrayBuffer)
    const tempDir = path.join(app.getAppPath(),"documents", "templates")
    fs.mkdirSync(tempDir, { recursive: true })
    const tempPath = path.join(tempDir, fileName) as string
    fs.writeFileSync(tempPath, buffer)
    const fullPath = path.resolve(tempPath) 
    return fullPath
  }