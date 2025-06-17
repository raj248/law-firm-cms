'use client'

import {
  Dialog, DialogTrigger, DialogContent,
  DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { z } from "zod"
import { useClientStore } from "@/stores/client-store"
import { ClientCombobox } from "./client-combo-box"
import { TagsCombobox } from "./tag-combo-box"
import { CourtCombobox } from "./court-combo-box"

const tagOptions = ["Urgent", "Criminal", "Civil", "Family", "Tax", "Custom"]

const caseSchema = z.object({
  client: z.string().min(1),
  court: z.string().min(1),
  tags: z.array(z.string()).optional(),
})

type CaseFormData = z.infer<typeof caseSchema>

export function AddCaseDialog({ onAdd }: {
  onAdd: (data: CaseFormData) => void
}) {
  const clients = useClientStore((state) => state.clients)

  const form = useForm<CaseFormData>({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      client: "",
      court: "",
      tags: [],
    },
  })

  const onSubmit = (data: CaseFormData) => {
    onAdd(data)
    form.reset()
    toast("Case added", { description: `Case for ${data.client} created.` })
  }

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
            <Label className="mb-2">Client</Label>
            <Controller
              control={form.control}
              name="client"
              render={({ field }) => (
                <ClientCombobox
                  value={field.value}
                  onChange={field.onChange}
                  clients={clients}
                />
              )}
            />
          </div>

          {/* Court */}
          <CourtCombobox
            value={form.watch("court") || ""}
            onChange={(val) => form.setValue("court", val, { shouldDirty: true, shouldValidate: true })}
            options={[
              "Tis Hazari Court",
              "Saket Court",
              "Rohini Court",
              "Dwarka Court",
              "Karkardooma Court",
              "Patiala House Court",
              "Rouse Avenue Court"
            ]}
          />


          <TagsCombobox
            tags={form.watch("tags") || []}
            setTags={(updated) =>
              form.setValue("tags", updated, { shouldValidate: true, shouldDirty: true })
            }
            options={tagOptions}
          />


          {/* Upload File Button */}
          <div>
            <Label className="mb-2">Documents</Label>
            <Button variant="secondary" type="button" className="w-full">Upload Files</Button>
          </div>

          <DialogFooter className="pt-2">
            <Button type="submit">Add Case</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
