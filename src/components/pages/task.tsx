"use client"

import { useEffect, useState } from "react"
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
import { Trash2, CheckCircle, CircleCheck } from "lucide-react"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { Badge } from "../ui/badge"

export default function TaskPage() {
  const { tasks, fetchTasks, deleteTask, markTaskCompleted } = useTaskStore()
  const [statusFilter, setStatusFilter] = useState<string>("All")

  useEffect(() => {
    fetchTasks()
  }, [])

  const getFilteredTasks = (priority: string) => {
    let filtered = priority === "All"
      ? tasks
      : tasks.filter((task) => task.priority === priority)

    if (statusFilter !== "All") {
      filtered = filtered.filter((task) => task.status === statusFilter)
    }

    return filtered
  }

  return (
    <div className="flex flex-col p-4 gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Tasks</h2>
        <AddTaskDialog />
      </div>

      <Tabs defaultValue="All" className="space-y-2">
        <TabsList>
          <TabsTrigger value="All">All</TabsTrigger>
          <TabsTrigger value="Urgent">Urgent</TabsTrigger>
          <TabsTrigger value="High">High</TabsTrigger>
          <TabsTrigger value="Medium">Medium</TabsTrigger>
          <TabsTrigger value="Low">Low</TabsTrigger>
        </TabsList>

        {["All", "Urgent", "High", "Medium", "Low"].map((priority) => (
          <TabsContent key={priority} value={priority} className="space-y-3">
            <ToggleGroup
              type="single"
              value={statusFilter}
              onValueChange={(val) => setStatusFilter(val || "All")}
              className="flex space-x-2"
            >
              {["All", "Open", "Pending", "Deffered", "Closed"].map((status) => (
                <ToggleGroupItem
                  key={status}
                  value={status}
                  className="
                    px-3 py-1 text-xs
                    first:rounded-l-full last:rounded-r-full rounded-full
                    data-[state=on]:bg-primary data-[state=on]:text-primary-foreground
                  "
                >
                  {status}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>



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
                    <CardHeader >
                      <CardTitle className="text-sm">{task.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground space-y-1">
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {task.status}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] capitalize">
                          {task.priority}
                        </Badge>
                      </div>

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
              <div className="flex flex-col items-center justify-center h-40 text-center space-y-2">
                <CircleCheck className="w-8 h-8 text-muted-foreground" />
                <p className="text-muted-foreground text-base font-medium">
                  {priority === "All" ? "No tasks." : `No ${priority} priority tasks.`}
                </p>
              </div>

            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
