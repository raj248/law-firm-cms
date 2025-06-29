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
import { ClientCombobox } from "../../combo-box/client-combo-box"
import { TagsCombobox } from "../../combo-box/tag-combo-box"
import { CourtCombobox } from "../../combo-box/court-combo-box"
import { Case } from "@/types"
import { useCaseStore } from "@/stores/case-store"
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"

const caseSchema = z.object({
  file_id: z.string().min(1, "File ID is required"),
  case_id: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  client: z.string().min(1, "Client is required"),
  court: z.string().min(1, "Court is required"),
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
        <Button size="sm">+ New Case</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg max-w-[90vw] max-h-[80vh] overflow-y-auto scrollbar-custom bg-popover">
        <DialogHeader>
          <DialogTitle className="text-lg">Add New Case</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            {/* File ID + Title */}
            <div className="flex flex-col sm:flex-row gap-3">
              <FormField
                control={form.control}
                name="file_id"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>File ID</FormLabel>
                    <FormControl>
                      <Input placeholder="File ID" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Case Title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Client + Court */}
            <div className="flex flex-col sm:flex-row gap-3">
              <FormField
                control={form.control}
                name="client"
                render={({ field }) => (
                  <FormItem className="flex-1">
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
                  <FormItem className="flex-1">
                    <FormControl>
                      <CourtCombobox
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tags */}
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <TagsCombobox
                      tags={field.value || []}
                      setTags={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Optional Fields */}
            <Accordion type="single" collapsible>
              <AccordionItem value="optional-fields">
                <AccordionTrigger>Optional Fields</AccordionTrigger>
                <AccordionContent className="space-y-2 mt-2">
                  <FormField
                    control={form.control}
                    name="case_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Case ID</FormLabel>
                        <FormControl>
                          <Input placeholder="Case ID (optional)" {...field} />
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
                          <Textarea
                            placeholder="Case description (optional)"
                            className="h-24"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <DialogFooter>
              <Button type="submit" className="w-full">Add Case</Button>
            </DialogFooter>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
