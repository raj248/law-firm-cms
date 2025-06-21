"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { useTaskStore } from "@/stores/task-store"
import { AddTaskDialog } from "../add-task-dialog"

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  const { tasks, fetchTasks } = useTaskStore()

  useEffect(() => {
    fetchTasks()
  }, [])

  const selectedDateISO = format(selectedDate!, "yyyy-MM-dd")
  const filteredTasks = tasks.filter(
    (t) => t.dueDate === selectedDateISO
  )

  return (
    <div className="flex flex-col gap-4 space-y-4">

      <div>
        <h2 className="text-xl font-semibold mb-2">
          Events on {selectedDate && format(selectedDate, "PPP")}
        </h2>
        {filteredTasks.length ? (
          <ul className="space-y-2">
            {filteredTasks.map((task) => (
              <li key={task.id} className="border rounded p-2">
                <p className="font-semibold">{task.title}</p>
                <p className="text-sm text-muted-foreground">
                  {task.dueDate} — {task.note}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">No events for this date.</p>
        )}
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          className="rounded-md border w-fit"
        />
      </div>

      <AddTaskDialog />
    </div>
  )
}
