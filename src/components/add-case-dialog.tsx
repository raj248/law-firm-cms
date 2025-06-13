'use client'

import {
  Dialog, DialogTrigger, DialogContent,
  DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { z } from "zod"
import * as React from "react"

const tagOptions = ["Urgent", "Criminal", "Civil", "Family", "Tax", "Custom"]

const caseSchema = z.object({
  client: z.string().min(1),
  caseDate: z.date(),
  courtType: z.string().min(1),
  hearingDate: z.date(),
  tags: z.array(z.string()).optional(),
})

type CaseFormData = z.infer<typeof caseSchema>

export function AddCaseDialog({ clients = [], onAdd }: {
  clients: string[]
  onAdd: (data: CaseFormData) => void
}) {
  const [tagOpen, setTagOpen] = React.useState(false)

  const form = useForm<CaseFormData>({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      client: "",
      courtType: "",
      caseDate: new Date(),
      hearingDate: new Date(),
      tags: [],
    },
  })

  const onSubmit = (data: CaseFormData) => {
    onAdd(data)
    form.reset()
    toast("Case added", { description: `Case for ${data.client} created.` })
  }

  const tags = form.watch("tags") || []
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>+ New Case</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Case</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Select Client */}
          <div>
            <Label>Client</Label>
            <select {...form.register("client")} className="w-full border p-2 rounded-md dark:bg-[var(--color-accent)] dark:text-[var(--color-accent-foreground)]">
              <option value="">Select client</option>
              {clients.map(client => (
                <option className="dark:bg-[var(--color-accent)] dark:text-[var(--color-accent-foreground)]" key={client} value={client}>{client}</option>
              ))}
            </select>
          </div>

          {/* Case Date */}
          <div>
            <Label>Case Date</Label>
            <Controller
              control={form.control}
              name="caseDate"
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(field.value, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                  </PopoverContent>
                </Popover>
              )}
            />
          </div>

          {/* Court Type */}
          <div>
            <Label>Court Type</Label>
            <Input {...form.register("courtType")} placeholder="e.g. District Court" />
          </div>

          {/* Hearing Date */}
          <div>
            <Label>Hearing Date</Label>
            <Controller
              control={form.control}
              name="hearingDate"
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(field.value, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                  </PopoverContent>
                </Popover>
              )}
            />
          </div>

          {/* Case Tags Multi-Select */}

          <div>
            <Label>Case Tags</Label>
            <Popover open={tagOpen} onOpenChange={setTagOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  {(form.getValues("tags") || []).length > 0
                    ? (form.getValues("tags") || []).join(", ")
                    : "Select tags"}

                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                {tagOptions.map(tag => (
                  <div key={tag} className="flex items-center space-x-2 py-1">
                    <Checkbox
                      id={tag}
                      checked={tags.includes(tag)}
                      onCheckedChange={(checked) => {
                        const updated = checked
                          ? [...tags, tag]
                          : tags.filter(t => t !== tag)
                        form.setValue("tags", updated, { shouldValidate: true, shouldDirty: true })
                      }}
                    />
                    <label htmlFor={tag} className="text-sm">{tag}</label>
                  </div>
                ))}
              </PopoverContent>
            </Popover>
          </div>

          {/* Upload File Button */}
          <div>
            <Label>Documents</Label>
            <Button variant="secondary" className="w-full">Upload Files</Button>
          </div>

          <DialogFooter className="pt-2">
            <Button type="submit">Add Case</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
