"use client"

import { useClientStore } from "@/stores/client-store"
import { useCaseStore } from "@/stores/case-store"
import { useTaskStore } from "@/stores/task-store"
import { useDocumentStore } from "@/stores/document-store"
import { useAuditStore } from "@/stores/audit-store"
import { useEffect } from "react"
import { DashboardStats } from "../dashboard/dashboard-stats"
import { QuickActions } from "../dashboard/quick-actions"
import { RecentClientsCases } from "../dashboard/recent-client-cases"
import { RecentDocumentsPanel } from "../dashboard/recent-documents-panel"
import { UpcomingTasksPanel } from "../dashboard/upcoming-tasks-panel"

export default function Dashboard() {
  const { clients, fetchClients } = useClientStore()
  const { cases, fetchCases } = useCaseStore()
  const { tasks, fetchTasks } = useTaskStore()
  const { documents, fetchDocuments, handleView } = useDocumentStore()
  const { fetchAudits } = useAuditStore()

  useEffect(() => {
    fetchClients()
    fetchCases()
    fetchTasks()
    fetchDocuments()
    fetchAudits()
  }, [])

  const sortByDateField = <T extends Record<string, any>>(arr: T[], field: string) =>
    [...arr].sort(
      (a, b) =>
        new Date(b[field] ?? b.created_at ?? 0).getTime() -
        new Date(a[field] ?? a.created_at ?? 0).getTime()
    )

  const recentClients = sortByDateField(clients, "updated_at").slice(0, 5)
  const recentCases = sortByDateField(cases, "updated_at").slice(0, 5)

  return (
    <div className="space-y-6 p-4 max-w-5xl mx-auto hide-scrollbar">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold">Welcome Back 👋</h2>
        <p className="text-muted-foreground">Here’s an overview of your law firm.</p>
      </div>

      <DashboardStats
        clientsCount={clients.length}
        activeCasesCount={cases.filter(c => c.status === "Open").length}
        upcomingTasksCount={tasks.filter(t => t.status !== "Closed").length}
      />

      <QuickActions />

      <RecentClientsCases
        recentClients={recentClients}
        recentCases={recentCases}
      />

      <UpcomingTasksPanel tasks={tasks} />

      <RecentDocumentsPanel documents={documents} onView={handleView} />


    </div>
  )
}
