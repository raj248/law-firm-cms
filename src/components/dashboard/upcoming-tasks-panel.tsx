// components/dashboard/UpcomingTasksPanel.tsx
"use client"

import { format } from "date-fns"
import { Task } from "@/types"
export function UpcomingTasksPanel({ tasks }: { tasks: Task[] }) {
  const upcomingTasks = [...tasks]
    .filter(t => t.status !== "Closed")
    .sort((a, b) => {
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      }
      if (a.dueDate) return -1
      if (b.dueDate) return 1
      return new Date(b.updated_at ?? b.created_at).getTime() - new Date(a.updated_at ?? a.created_at).getTime()
    })
    .slice(0, 5)

  return (
    <div>
      <h3 className="text-base font-semibold mb-2">Upcoming Tasks</h3>
      {upcomingTasks.length ? (
        <ul className="space-y-1 text-sm">
          {upcomingTasks.map(task => (
            <li key={task.id} className="flex justify-between items-center">
              <span>{task.title}</span>
              <span className="text-muted-foreground text-xs">
                {task.dueDate ? format(new Date(task.dueDate), "PPP") : "No due date"}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No upcoming tasks.</p>
      )}
    </div>
  )
}
