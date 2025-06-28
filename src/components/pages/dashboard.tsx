"use client"

import { useClientStore } from "@/stores/client-store"
import { useCaseStore } from "@/stores/case-store"
import { useTaskStore } from "@/stores/task-store"
import { useDocumentStore } from "@/stores/document-store"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Briefcase, CalendarDays, FileText } from "lucide-react"
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import { AddClientDialog } from "@/components/add-client-dialog"
import { AddCaseDialog } from "@/components/add-case-dialog"
import { useEffect } from "react"
import { format } from "date-fns"
import { Link } from "react-router-dom"
import { AddTaskDialog } from "../add-task-dialog"

export default function Dashboard() {
  const { clients, fetchClients } = useClientStore()
  const { cases, fetchCases } = useCaseStore()
  const { tasks, fetchTasks } = useTaskStore()
  const { documents, fetchDocuments, handleView } = useDocumentStore()

  useEffect(() => {
    fetchClients()
    fetchCases()
    fetchTasks()
    fetchDocuments()
  }, [])

  // Sort utilities
  const sortByDateField = <T extends Record<string, any>>(arr: T[], field: string) =>
    [...arr].sort(
      (a, b) =>
        new Date(b[field] ?? b.created_at ?? 0).getTime() -
        new Date(a[field] ?? a.created_at ?? 0).getTime()
    )

  const recentClients = sortByDateField(clients, "updated_at").slice(0, 5)
  const recentCases = sortByDateField(cases, "updated_at").slice(0, 5)

  const upcomingTasks = [...tasks]
    .filter((t) => t.status !== "Closed")
    .sort((a, b) => {
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      }
      if (a.dueDate) return -1
      if (b.dueDate) return 1
      // fallback: sort by updated_at if available
      return new Date(b.updated_at ?? b.created_at).getTime() - new Date(a.updated_at ?? a.created_at).getTime()
    })
    .slice(0, 5)

  const recentDocuments = [...documents]
    .sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime())
    .slice(0, 8)

  return (
    <div className="space-y-6 p-4 max-w-5xl mx-auto">
      {/* Welcome */}
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold">Welcome Back 👋</h2>
        <p className="text-muted-foreground">Here’s an overview of your law firm.</p>
      </div>

      {/* Stats Summary */}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          {
            title: "Total Clients",
            count: clients.length,
            delta: "Tracking",
            icon: Users,
            path: "/clients",
          },
          {
            title: "Active Cases",
            count: cases.filter((c) => c.status === "Open").length,
            delta: "In progress",
            icon: Briefcase,
            path: "/cases",
          },
          {
            title: "Upcoming Tasks",
            count: tasks.filter((t) => t.status !== "Closed").length,
            delta: "Pending",
            icon: CalendarDays,
            path: "/task",
          },
        ].map((stat, i) => (
          <Link to={stat.path} key={i} className="hover:no-underline">
            <Card className="hover:shadow-md hover:ring-1 hover:ring-primary transition cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-1">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold">{stat.count}</p>
                <p className="text-xs text-muted-foreground">{stat.delta}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>


      {/* Quick Actions */}
      <div className="flex flex-wrap justify-center gap-2">
        <AddClientDialog />
        <AddCaseDialog />
        <AddTaskDialog />
      </div>

      {/* Recent Clients and Cases */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recently Updated Clients */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Recently Updated Clients</CardTitle>
          </CardHeader>
          <CardContent>
            {recentClients.length ? (
              <ul className="space-y-1 text-sm">
                {recentClients.map((client) => (
                  <HoverCard key={client.id} openDelay={100} closeDelay={50}>
                    <HoverCardTrigger asChild>
                      <li className="flex justify-between cursor-pointer hover:text-primary">
                        <span>{client.name}</span>
                        <span className="text-muted-foreground text-xs">
                          {client.updated_at
                            ? format(new Date(client.updated_at), "PPP")
                            : format(new Date(client.created_at), "PPP")}
                        </span>
                      </li>
                    </HoverCardTrigger>
                    <HoverCardContent className="text-xs space-y-1">
                      <p><span className="font-medium">Name:</span> {client.name}</p>
                      <p><span className="font-medium">Phone:</span> {client.phone}</p>
                      {client.email && <p><span className="font-medium">Email:</span> {client.email}</p>}
                      {client.address && <p><span className="font-medium">Address:</span> {client.address}</p>}
                      {client.note && <p><span className="font-medium">Note:</span> {client.note}</p>}
                    </HoverCardContent>
                  </HoverCard>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No clients found.</p>
            )}
          </CardContent>
        </Card>

        {/* Recently Updated Cases */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Recently Updated Cases</CardTitle>
          </CardHeader>
          <CardContent>
            {recentCases.length ? (
              <ul className="space-y-1 text-sm">
                {recentCases.map((c) => (
                  <HoverCard key={c.case_id} openDelay={100} closeDelay={50}>
                    <HoverCardTrigger asChild>
                      <li className="flex justify-between cursor-pointer hover:text-primary">
                        <span>{c.title}</span>
                        <span className="text-muted-foreground text-xs">
                          {c.updated_at
                            ? format(new Date(c.updated_at), "PPP")
                            : format(new Date(c.created_at), "PPP")}
                        </span>
                      </li>
                    </HoverCardTrigger>
                    <HoverCardContent className="text-xs space-y-1">
                      <p><span className="font-medium">Title:</span> {c.title}</p>
                      <p><span className="font-medium">File ID:</span> {c.file_id}</p>
                      <p><span className="font-medium">Court:</span> {c.court}</p>
                      <p><span className="font-medium">Status:</span> {c.status}</p>
                      {(c.tags ?? []).length > 0 && (
                        <p><span className="font-medium">Tags:</span> {c.tags!.join(", ")}</p>
                      )}

                    </HoverCardContent>
                  </HoverCard>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No cases found.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Tasks */}
      <div>
        <h3 className="text-base font-semibold mb-2">Upcoming Tasks</h3>
        {upcomingTasks.length ? (
          <ul className="space-y-1 text-sm">
            {upcomingTasks.map((task) => (
              <li key={task.id} className="flex justify-between items-center">
                <span>{task.title}</span>
                <span className="text-muted-foreground text-xs">
                  {task.dueDate
                    ? format(new Date(task.dueDate), "PPP")
                    : "No due date"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No upcoming tasks.</p>
        )}
      </div>

      {/* Recent Documents */}
      <div>
        <h3 className="text-base font-semibold mb-2">Recent Documents</h3>
        <div className="flex gap-3 overflow-x-auto pb-1 hide-scrollbar p-3">
          {recentDocuments.length ? (
            recentDocuments.map((doc) => (
              <button
                key={doc.id}
                onClick={() => handleView(doc)}
                className="min-w-[180px] flex-shrink-0 rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary transition-transform hover:scale-[1.02] active:scale-95"
              >
                <Card className="w-full h-full">
                  <CardHeader className="flex flex-row items-center justify-between pb-1">
                    <CardTitle className="text-sm font-medium truncate">{doc.name}</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(doc.lastAccessed), "PPP")}
                    </p>
                  </CardContent>
                </Card>
              </button>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No documents found.</p>
          )}
        </div>
      </div>

    </div>
  )
}
