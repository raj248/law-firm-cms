"use client"

import { useState } from "react"
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  note: z.string().optional(),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]),
  dueDate: z.string().optional(),
  file_id: z.string().optional(),
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
      priority: "Low",
      dueDate: "",
      file_id: "",
      client_id: "",
    }
  })

  const onSubmit = (data: TaskFormValues) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: data.title.trim(),
      note: data.note?.trim() || "",
      status: "Open",
      priority: data.priority,
      dueDate: data.dueDate?.slice(0, 10),
      caseId: data.file_id || "",
      client_id: data.client_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_synced: 0,
    }

    useTaskStore.getState().addTask(newTask)
    form.reset()
    setDialogOpen(false)
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Add Task</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm max-w-[90vw]">
        <DialogHeader>
          <DialogTitle className="text-lg">New Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          {/* Title */}
          <div>
            <Label>Title</Label>
            <Input {...form.register("title")} className="mt-1" />
          </div>

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <textarea
              {...form.register("note")}
              className="w-full rounded-md border px-3 py-2 text-sm mt-1 h-24"
            />
          </div>

          {/* Priority */}
          <div>
            <Label>Priority</Label>
            <Controller
              control={form.control}
              name="priority"
              render={({ field }) => (
                <ToggleGroup
                  type="single"
                  value={field.value}
                  onValueChange={field.onChange}
                  className="w-full mt-1"
                >
                  {["Low", "Medium", "High", "Urgent"].map((p) => (
                    <ToggleGroupItem
                      key={p}
                      value={p}
                      className={`
                        flex-1 text-xs py-1
                        hover:bg-${p === "Low" ? "gray-200" : p === "Medium" ? "blue-200" : p === "High" ? "orange-200" : "red-200"}
                      `}
                    >
                      {p}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              )}
            />
          </div>

          {/* Accordion for Optional Fields */}
          <Accordion type="single" collapsible>
            <AccordionItem value="optional-fields">
              <AccordionTrigger>Optional Details</AccordionTrigger>
              <AccordionContent className="space-y-3">

                {/* Due Date */}
                <div>
                  <Label>Due Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-between font-normal mt-1"
                      >
                        {form.watch("dueDate")
                          ? format(new Date(form.watch("dueDate")!), "PPP")
                          : "Select date"}
                        <ChevronDownIcon className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={form.watch("dueDate") ? new Date(form.watch("dueDate")!) : undefined}
                        onSelect={(date) =>
                          date && form.setValue("dueDate", date.toISOString())
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Client */}
                <div>
                  <Label>Client</Label>
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

                {/* Case */}
                <div>
                  <Label>Case</Label>
                  <Controller
                    control={form.control}
                    name="file_id"
                    render={({ field }) => (
                      <CaseCombobox
                        value={cases.find((c) => c.file_id === field.value)?.title || ""}
                        onChange={field.onChange}
                        cases={cases}
                      />
                    )}
                  />
                </div>

              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Button type="submit" className="w-full">Save</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
