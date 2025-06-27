"use client"

import { useEffect } from "react"
import { format } from "date-fns"
import { useTaskStore } from "@/stores/task-store"
import { AddTaskDialog } from "../add-task-dialog"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Trash2, CheckCircle } from "lucide-react"

export default function TaskPage() {
  const { tasks, fetchTasks, deleteTask, markTaskCompleted } = useTaskStore()

  useEffect(() => {
    fetchTasks()
  }, [])

  const getFilteredTasks = (priority: string) => {
    return priority === "all"
      ? tasks
      : tasks.filter((task) => task.priority === priority)
  }

  return (
    <div className="flex flex-col p-4 gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Tasks</h2>
        <AddTaskDialog />
      </div>

      <Tabs defaultValue="all" className="space-y-2">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="Urgent">Urgent</TabsTrigger>
          <TabsTrigger value="High">High</TabsTrigger>
          <TabsTrigger value="Medium">Medium</TabsTrigger>
          <TabsTrigger value="Low">Low</TabsTrigger>
        </TabsList>

        {["all", "Urgent", "High", "Medium", "Low"].map((priority) => (
          <TabsContent key={priority} value={priority}>
            {getFilteredTasks(priority).length ? (
              <div
                className="
                  grid gap-3 
                  grid-cols-[repeat(auto-fit,minmax(220px,1fr))]
                "
              >
                {getFilteredTasks(priority).map((task) => (
                  <Card
                    key={task.id}
                    className="hover:shadow-sm transition-shadow relative"
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{task.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground space-y-1">
                      {task.dueDate && (
                        <p>{format(new Date(task.dueDate), "PPP")}</p>
                      )}
                      {task.note && <p>{task.note}</p>}
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => markTaskCompleted(task.id)}
                        >
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => deleteTask(task.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                No {priority} priority tasks.
              </p>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
