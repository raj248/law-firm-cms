'use client'

import {
  Dialog, DialogTrigger, DialogContent,
  DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useClientStore } from "@/stores/client-store"
import { ClientCombobox } from "./client-combo-box"
import { TagsCombobox } from "./tag-combo-box"
import { CourtCombobox } from "./court-combo-box"
import { Case } from "@/types"
import { useCaseStore } from "@/stores/case-store"
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

const caseSchema = z.object({
  file_id: z.string().min(1, "File ID is Required"),
  case_id: z.string().optional(),
  title: z.string().min(1, "Title is Required"),
  description: z.string().optional(),
  client: z.string().min(1, "Must Have a Client (someones gotta pay for this case)"),
  court: z.string().min(1, "Must Have a Court"),
  tags: z.array(z.string()).optional(),
})

type CaseFormData = z.infer<typeof caseSchema>

const onAdd = (data: CaseFormData) => {
  const newCase: Case = {
    file_id: data.file_id,
    case_id: data.case_id ?? "",
    title: data.title,
    description: data.description ?? "Not Available",
    client_id: data.client,
    court: data.court,
    status: "Open",
    created_at: new Date().toISOString(),
    tags: data.tags || [],
    is_synced: 0,
  }

  useCaseStore.getState().addCase(newCase)
}

export function AddCaseDialog({ id = "" }: { id?: string }) {
  const clients = useClientStore((state) => state.clients)
  const client = clients.find((c) => c.id === id)

  const form = useForm<CaseFormData>({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      file_id: "",
      title: "",
      client: client?.id || "",
      court: "",
      tags: [],
    },
  })

  const onSubmit = (data: CaseFormData) => {
    onAdd(data)
    form.reset()
  }

  return (
    <Dialog onOpenChange={(open) => { if (!open) form.reset() }}>
      <DialogTrigger asChild>
        <Button>+ New Case</Button>
      </DialogTrigger>

      <DialogContent className="!max-w-screen-md !w-full p-6 overflow-y-auto hide-scrollbar">
        <DialogHeader>
          <DialogTitle>Add New Case</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="file_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>File ID</FormLabel>
                    <FormControl>
                      <Input placeholder="(Required) File ID" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="(Required) Case Title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="case_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Case ID</FormLabel>
                    <FormControl>
                      <Input placeholder="(Optional) Case ID" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="(Optional) Case Description" className="h-32" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="client"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <FormControl>
                      <ClientCombobox
                        value={clients.find((c) => c.id === field.value)?.name || ""}
                        onChange={field.onChange}
                        clients={clients}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="court"
                render={({ field }) => (
                  <FormItem>
                    {/* <FormLabel>Court</FormLabel> */}
                    <FormControl>
                      <CourtCombobox
                        value={field.value}
                        onChange={(val) => field.onChange(val)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    {/* <FormLabel>Tags</FormLabel> */}
                    <FormControl>
                      <TagsCombobox
                        tags={field.value || []}
                        setTags={(updated) => field.onChange(updated)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="col-span-full">
              <DialogFooter className="pt-2">
                <Button type="submit">Add Case</Button>
              </DialogFooter>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
