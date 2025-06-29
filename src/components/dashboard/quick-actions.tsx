// components/dashboard/QuickActions.tsx
"use client"

import { AddClientDialog } from "@/components/dialogs/add/add-client-dialog"
import { AddCaseDialog } from "@/components/dialogs/add/add-case-dialog"
import { AddTaskDialog } from "@/components/dialogs/add/add-task-dialog"

export function QuickActions() {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <AddClientDialog />
      <AddCaseDialog />
      <AddTaskDialog />
    </div>
  )
}
