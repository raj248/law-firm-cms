"use client"

import { CaseTable } from "../case-table"


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
