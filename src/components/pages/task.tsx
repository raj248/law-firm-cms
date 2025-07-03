"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { useTaskStore } from "@/stores/task-store"
import { AddTaskDialog } from "../dialogs/add/add-task-dialog"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
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
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../ui/hover-card"
import { useClientStore } from "@/stores/client-store"
import { useCaseStore } from "@/stores/case-store"

export default function TaskPage() {
  const { tasks, fetchTasks, deleteTask, markTaskCompleted } = useTaskStore()
  const { getCaseById } = useCaseStore()
  const { getClientById } = useClientStore()

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
                  flex flex-wrap gap-3
                "
              >
                {getFilteredTasks(priority).map((task) => (
                  <Card
                    key={task.id}
                    className="hover:shadow-sm transition-shadow relative w-fit min-w-[220px] max-w-sm"
                  >
                    <CardHeader className="pb-1">
                      <CardTitle className="text-base font-semibold text-foreground">
                        {task.title}
                      </CardTitle>
                      {task.note && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-4">
                          {task.note}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground space-y-1">
                      {/* Status & Priority Badges */}
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {task.status}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] capitalize">
                          {task.priority}
                        </Badge>
                      </div>

                      {/* Due Date */}
                      {task.dueDate && (
                        <p>
                          <span className="font-medium text-foreground">Due:</span>{" "}
                          {format(new Date(task.dueDate), "PPP")}
                        </p>
                      )}

                      {/* Hover Cards for Case & Client */}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {task.caseId && (
                          <HoverCard openDelay={100} closeDelay={50}>
                            <HoverCardTrigger asChild>
                              {(() => {
                                const caseData = getCaseById(task.caseId!)
                                return (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 px-2 text-[10px]"
                                  >
                                    Case: {caseData ? caseData.title : `${task.caseId.slice(0, 6)}...`}
                                  </Button>
                                )
                              })()}
                            </HoverCardTrigger>

                            <HoverCardContent className="text-xs space-y-1 max-w-xs">
                              {(() => {
                                const caseData = getCaseById(task.caseId!)
                                return caseData ? (
                                  <>
                                    <p><span className="font-medium">Title:</span> {caseData.title}</p>
                                    <p><span className="font-medium">File ID:</span> {caseData.file_id}</p>
                                    <p><span className="font-medium">Court:</span> {caseData.court}</p>
                                    <p><span className="font-medium">Status:</span> {caseData.status}</p>
                                    {Array.isArray(caseData.tags) && caseData.tags.length > 0 && (
                                      <p><span className="font-medium">Tags:</span> {caseData.tags.join(", ")}</p>
                                    )}
                                  </>
                                ) : (
                                  <p className="text-muted-foreground">Case data not found.</p>
                                )
                              })()}
                            </HoverCardContent>
                          </HoverCard>

                        )}

                        {task.client_id && (
                          <HoverCard openDelay={100} closeDelay={50}>
                            <HoverCardTrigger asChild>
                              {(() => {
                                const clientData = getClientById(task.client_id!)
                                return (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 px-2 text-[10px]"
                                  >
                                    Client: {clientData ? clientData.name : `${task.client_id.slice(0, 6)}...`}
                                  </Button>
                                )
                              })()}
                            </HoverCardTrigger>

                            <HoverCardContent className="text-xs space-y-1 max-w-xs">
                              {(() => {
                                const clientData = getClientById(task.client_id!)
                                return clientData ? (
                                  <>
                                    <p><span className="font-medium">Name:</span> {clientData.name}</p>
                                    <p><span className="font-medium">Phone:</span> {clientData.phone}</p>
                                    {clientData.email && (
                                      <p><span className="font-medium">Email:</span> {clientData.email}</p>
                                    )}
                                    {clientData.address && (
                                      <p><span className="font-medium">Address:</span> {clientData.address}</p>
                                    )}
                                    {clientData.note && (
                                      <p><span className="font-medium">Note:</span> {clientData.note}</p>
                                    )}
                                  </>
                                ) : (
                                  <p className="text-muted-foreground">Client data not found.</p>
                                )
                              })()}
                            </HoverCardContent>
                          </HoverCard>

                        )}
                      </div>
                    </CardContent>


                    <CardFooter className="flex justify-between items-center pt-1">
                      <div className="flex gap-2">
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
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(task.created_at), "PPP")}
                      </p>
                    </CardFooter>
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
