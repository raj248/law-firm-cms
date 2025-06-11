"use client"

import { ClientTable } from "@/components/client-table"
import { casesColumns } from "@/components/columns/cases-columns"
import { Case } from "@/types"
import { CaseTable } from "../case-table"

const cases: Case[] = [
  {
    id: "C-101",
    title: "Property Dispute",
    clientName: "John Doe",
    status: "Open",
    courtDate: "2025-06-20",
    assignedLawyer: "Adv. Sharma",
  },
  {
    id: "C-102",
    title: "Criminal Defense",
    clientName: "Jane Smith",
    status: "Closed",
    courtDate: "2024-11-05",
    assignedLawyer: "Adv. Mehta",
  },
  {
    id: "C-103",
    title: "Divorce Settlement",
    clientName: "Ravi Kumar",
    status: "Pending",
    courtDate: "2025-07-15",
    assignedLawyer: "Adv. Patel",
  },
  {
    id: "C-104",
    title: "Cheque Bounce",
    clientName: "Amit Sharma",
    status: "Open",
    courtDate: "2025-06-25",
    assignedLawyer: "Adv. Reddy",
  },
]

export default function CasesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Cases</h2>
        <p className="text-muted-foreground">Track and manage all your legal cases here.</p>
      </div>

      {/* Table */}
      <CaseTable />
    </div>
  )
}
