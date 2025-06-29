
export type newAudit = {
  action_type: string
  object_type: string
  object_id: string
}

export interface Audit {
  id: string
  created_at: string
  user_id: string
  user_name: string
  action_type: string
  object_type: string
  object_id: string
  is_synced: number // 0 = not synced, 1 = synced
}

export type User = {
  id: string
  name: string
  email: string
  role: string
  created_at: string
  user_id: string
}

export type NewClient = {
  id: string         // optional, generated
  name: string
  phone: string
  email: string
  address?: string
  note?: string
}

export type Client = {
  id: string
  name: string
  phone: string
  email: string
  address?: string
  note?: string
  created_at: string
  updated_at: string
  is_synced: number // 0 = not synced, 1 = synced
}

export type Case = {
  file_id: string
  case_id: string
  title: string
  description: string
  status: typeof statusOptions[number]
  client_id: string
  court: string
  tags?: string[]
  created_at: string
  updated_at? : string
  is_synced: number // 0 = not synced, 1 = synced
}

export type Task = {
  id: string
  title: string
  note?: string
  status: "Open" | "Pending" | "Closed" | "Deffered"
  priority: "Low" | "Medium" | "High" | "Urgent"
  dueDate?: string // ISO format
  caseId?: string
  client_id?: string
  created_at: string
  updated_at?: string
  is_synced: number // 0 = not synced, 1 = synced
}

export type DocumentMetadata = {
  id: string
  name: string
  localPath: string
  lastAccessed: string
  size: number
  mimetype: string
}

export type Court = {
  id: string
  name: string
  created_at: string
}

export type Tag = {
  id: string
  name: string
  created_at: string
}

export const statusOptions = ["Open", "Pending", "Closed"] as const;