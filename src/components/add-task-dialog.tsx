"use client"

import { useState } from "react"
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Task } from "@/types"
import { Calendar } from "./ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { format } from "date-fns"
import { ChevronDownIcon } from "lucide-react"
import { useTaskStore } from "@/stores/task-store"
import { Controller, useForm } from "react-hook-form"
import { ClientCombobox } from "./client-combo-box"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useClientStore } from "@/stores/client-store"
import { useCaseStore } from "@/stores/case-store"
import { CaseCombobox } from "./case-combo-box"

const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const minutes = ['00', '10', '20', '30', '40', '50']

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  note: z.string().min(0, "Note is required"),
  dueDate: z.string().optional(),
  hour: z.string().optional(),
  minute: z.string().optional(),
  priority: z.enum(["Low", "Medium", "High"]),
  status: z.enum(["Open", "Pending", "Closed"]),
  caseId: z.string().optional(),
  client_id: z.string().optional(),
})

type TaskFormValues = z.infer<typeof taskSchema>

export function AddTaskDialog() {
  const [dialogOpen, setDialogOpen] = useState(false)

  const clients = useClientStore.getState().clients
  const cases = useCaseStore.getState().cases

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      note: "",
      dueDate: "",
      hour: "",
      minute: "",
      priority: "Low",
      status: "Open",
      caseId: "",
      client_id: "",
    }
  })


  const onSubmit = (data: TaskFormValues) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: data.title.trim(),
      note: data.note.trim() || "",
      dueDate: data.dueDate?.slice(0, 10),
      time: data.hour && data.minute ? `${data.hour}:${data.minute}` : '',
      status: data.status,
      priority: data.priority,
      client_id: data.client_id,
      caseId: data.caseId || "",
      updated_at: new Date().toISOString(),
      is_synced: 0,
    }

    useTaskStore.getState().addTask(newTask)
    form.reset()
    setDialogOpen(false)
    window.debug.log("Data Notes: ", data.note)
  }
  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button>Add Task</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input {...form.register("title")} />
          </div>

          <div>
            <Label>Notes</Label>
            <textarea
              {...form.register("note")}
              className="w-full rounded-md border px-3 py-2 text-sm h-32"
            />
          </div>

          <div className="flex">
            <div className="flex flex-col gap-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-38 justify-between font-normal">
                    {form.watch("dueDate")
                      ? format(new Date(form.watch("dueDate")!), "PPP")
                      : "Select date"}
                    <ChevronDownIcon className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={
                      form.watch("dueDate")
                        ? new Date(form.watch("dueDate")!)
                        : undefined
                    }
                    onSelect={(date) =>
                      date && form.setValue("dueDate", date.toISOString())
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex-1 flex ml-12 ">
              <div className="flex-1">
                <Label className="mb-2">Hour</Label>
                <Controller
                  control={form.control}
                  name="hour"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="HH" /></SelectTrigger>
                      <SelectContent>{hours.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="flex-1">
                <Label className="mb-2">Minute</Label>
                <Controller
                  control={form.control}
                  name="minute"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="MM" /></SelectTrigger>
                      <SelectContent>{minutes.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </div>

          <div>
            <Label className="mb-2">Client</Label>
            <Controller
              control={form.control}
              name="client_id"
              render={({ field }) => (
                <ClientCombobox
                  value={clients.find((c) => c.id === field.value)?.name || ""}
                  onChange={field.onChange}
                  clients={clients}
                />
              )}
            />
          </div>

          <div>
            <Label className="mb-2">Case</Label>
            <Controller
              control={form.control}
              name="caseId"
              render={({ field }) => (
                <CaseCombobox
                  value={cases.find((c) => c.id === field.value)?.title || ""}
                  onChange={field.onChange}
                  cases={cases}
                />
              )}
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Priority</Label>
              <Controller
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="flex-1">
              <Label>Status</Label>
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <Button type="submit" className="w-full">Save</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
