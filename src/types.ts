export interface Case {
  id: string
  title: string
  clientName: string
  status: "Open" | "Closed" | "Pending"
  courtDate: string // ISO format
  assignedLawyer: string
}
