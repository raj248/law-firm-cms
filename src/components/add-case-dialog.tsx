'use client'

import {
  Dialog, DialogTrigger, DialogContent,
  DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useClientStore } from "@/stores/client-store"
import { ClientCombobox } from "./client-combo-box"
import { TagsCombobox } from "./tag-combo-box"
import { CourtCombobox } from "./court-combo-box"
import { Case, courtOptions, tagOptions } from "@/types"
import { useCaseStore } from "@/stores/case-store"

const caseSchema = z.object({
  id: z.string().min(16),
  title: z.string().min(1),
  description: z.string().min(1),
  client: z.string().min(1),
  court: z.string().min(1),
  tags: z.array(z.string()).optional(),
})


type CaseFormData = z.infer<typeof caseSchema>

const onAdd = (data: CaseFormData) => {
  const newCase: Case = {
    id: data.id,
    title: data.title,
    description: data.description,
    clientId: data.client,
    court: data.court,
    status: "Open", // default status on creation
    createdAt: new Date().toISOString(),
    tags: data.tags || [],
  }

  // Save to store or backend
  // Example: useCaseStore.getState().addCase(newCase)
  useCaseStore.getState().addCase(newCase)
  window.debug.log("Case created:", newCase)
}

export function AddCaseDialog({ id = "" }: {
  id?: string
}) {
  const clients = useClientStore((state) => state.clients)
  const client = clients.find((c) => c.id === id)


  const form = useForm<CaseFormData>({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      id: "",
      title: "",
      description: "",
      client: client?.id || "",
      court: "",
      tags: [],
    },
  })


  const onSubmit = (data: CaseFormData) => {
    onAdd(data)
    form.reset()
  }
  const courts = courtOptions.map((c) => c)
  const tags = tagOptions.map((t) => t)

  return (
    <Dialog onOpenChange={(open) => {
      if (!open) {
        form.reset()
      }
    }}
    >
      <DialogTrigger asChild>
        <Button>+ New Case</Button>
      </DialogTrigger>
      <DialogContent className=" overflow-y-auto hide-scrollbar !max-w-screen-lg !w-full p-6">
        <DialogHeader>
          <DialogTitle>Add New Case</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: ID, Title, Description */}
          <div className="flex flex-col gap-4">
            <div>
              <Label htmlFor="id">Case ID</Label>
              <input
                id="id"
                {...form.register("id", { required: true })}
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Enter Case ID"
              />
            </div>

            <div>
              <Label htmlFor="title">Title</Label>
              <input
                id="title"
                {...form.register("title", { required: true })}
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Enter case title"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                {...form.register("description", { required: true })}
                className="w-full rounded-md border px-3 py-2 text-sm h-32"
                placeholder="Case details..."
              />
            </div>
          </div>

          {/* Right: Client, Court, Tags, Docs */}
          <div className="flex flex-col gap-4">
            <div>
              <Label className="mb-2">Client</Label>
              <Controller
                control={form.control}
                name="client"
                render={({ field }) => (
                  <ClientCombobox
                    value={clients.find((c) => c.id === field.value)?.name || ""}
                    onChange={field.onChange}
                    clients={clients}
                  />
                )}
              />
            </div>

            <CourtCombobox
              value={form.watch("court") || ""}
              onChange={(val) =>
                form.setValue("court", val, { shouldDirty: true, shouldValidate: true })
              }
              options={courts}
            />

            <TagsCombobox
              tags={form.watch("tags") || []}
              setTags={(updated) =>
                form.setValue("tags", updated, { shouldValidate: true, shouldDirty: true })
              }
              options={tags}
            />

            <div>
              <Label className="mb-2">Documents</Label>
              <Button variant="secondary" type="button" className="w-full">
                Upload Files
              </Button>
            </div>
          </div>

          {/* Full Width Footer */}
          <div className="col-span-full">
            <DialogFooter className="pt-2">
              <Button type="submit">Add Case</Button>
            </DialogFooter>
          </div>
        </form>


      </DialogContent>
    </Dialog>
  )
}
