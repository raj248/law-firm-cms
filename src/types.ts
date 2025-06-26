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
  id: string
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
  dueDate?: string // ISO format
  time?: string // "14:00"
  status: "Open" | "Pending" | "Closed"
  priority: "Low" | "Medium" | "High"
  caseId?: string
  client_id?: string
  updated_at?: string
  is_synced: number // 0 = not synced, 1 = synced
}


export type Document = {
  id: string
  filename: string
  path: string // local or remote path
  client_id: string
  case_id: string
  uploaded_at: string // ISO timestamp
  is_synced: number // 0 = not synced, 1 = synced
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