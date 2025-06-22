"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { useTaskStore } from "@/stores/task-store"
import { AddTaskDialog } from "../add-task-dialog"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from "@/components/ui/tabs"

export default function TaskPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const { tasks, fetchTasks } = useTaskStore()

  useEffect(() => {
    fetchTasks()
  }, [])

  const selectedDateISO = format(selectedDate!, "yyyy-MM-dd")
  const filteredByDate = tasks.filter((t) => t.dueDate === selectedDateISO)

  const getFilteredTasks = (priority: string) => {
    return priority === "all"
      ? tasks
      : tasks.filter((task) => task.priority === priority)
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 p-4">
      {/* Left: Task List with Tabs */}
      <div className="flex-1">
        <h2 className="text-2xl font-semibold mb-4">Tasks</h2>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="High">High</TabsTrigger>
            <TabsTrigger value="Medium">Medium</TabsTrigger>
            <TabsTrigger value="Low">Low</TabsTrigger>
          </TabsList>

          {["all", "High", "Medium", "Low"].map((priority) => (
            <TabsContent key={priority} value={priority}>
              {getFilteredTasks(priority).length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getFilteredTasks(priority).map((task) => (
                    <Card key={task.id}>
                      <CardHeader>
                        <CardTitle className="text-base">{task.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          {task.dueDate
                            ? format(new Date(task.dueDate), "PPP")
                            : "No Due Date"}{" "}
                          • {task.time || "No Due Time"}
                        </p>
                        {task.note && <p className="text-sm">{task.note}</p>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No {priority} priority tasks.</p>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Right: Calendar + Add Task */}
      <div className="w-full md:w-[300px] space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Calendar</h2>
          <AddTaskDialog />
        </div>

        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (date) setSelectedDate(date) // ✅ only set if a valid date
          }}
          className="rounded-md border"
        />

        <div>
          <h3 className="text-sm font-medium mb-2">
            Tasks on {format(selectedDate!, "PPP")}
          </h3>
          {filteredByDate.length ? (
            <ul className="space-y-2">
              {filteredByDate.map((task) => (
                <li key={task.id} className="border rounded p-2 text-sm">
                  <p className="font-medium">{task.title}</p>
                  <p className="text-muted-foreground">{task.note}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">No tasks for this date.</p>
          )}
        </div>
      </div>
    </div>
  )
}
