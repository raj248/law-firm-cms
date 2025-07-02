"use client"

import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import {
  Dialog, DialogTrigger, DialogContent,
  DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import {
  Form, FormField, FormItem,
  FormLabel, FormControl, FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { useClientStore } from "@/stores/client-store"
import { useDialogStore } from "@/stores/dialog-store"
import { useState } from "react"

const clientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Phone must be at least 10 digits"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional(),
  note: z.string().optional(),
})

type ClientFormData = z.infer<typeof clientSchema>

const onAdd = (data: ClientFormData) => {
  const id = crypto.randomUUID()
  useClientStore.getState().addClient({
    ...data,
    email: data.email ?? '',
    address: data.address ?? '',
    note: data.note ?? '',
    id: id,
  })
  // window.debug.log("Client added:", data)
}

export function AddClientDialog() {
  const [open, setOpen] = useState(false)
  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      note: "",
    },
  })

  const onSubmit = (data: ClientFormData) => {
    onAdd(data)
    form.reset()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={(state) => {
      if (!state) form.reset()
      setOpen(state)
    }}>
      <DialogTrigger asChild>
        <Button size="sm">+ New Client</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm max-w-[90vw]">
        <DialogHeader>
          <DialogTitle className="text-lg">Add New Client</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">

            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="+91 9876543210" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Accordion for Optional Fields */}
            <Accordion type="single" collapsible>
              <AccordionItem value="optional-fields">
                <AccordionTrigger>Optional Details</AccordionTrigger>
                <AccordionContent className="space-y-3 mt-2">

                  {/* Email */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="john@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Address */}
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Street, City" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Note */}
                  <FormField
                    control={form.control}
                    name="note"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Note</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Optional notes about the client..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <DialogFooter>
              <Button type="submit" className="w-full">Add Client</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
