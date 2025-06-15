export type User = {
  id: string
  username: string
  password_hash: string
}

export type Client = {
  id: string
  name: string
  phone: string
  email: string
  address?: string
  notes?: string
}

export type Case = {
  id: string
  title: string
  description: string
  status: "Open" | "Closed" | "Pending"
  clientId: string
  court: string
  createdAt: string
  tags?: string[]
}

export type Appointment = {
  id: string
  title: string
  date: string // ISO format (e.g., "2025-06-15")
  clientId: string
  caseId: string
  time: string // e.g., "14:00"
  notes?: string
}

export type Document = {
  id: string
  filename: string
  path: string // local or remote path
  client_id: string
  case_id: string
  uploaded_at: string // ISO timestamp
}
