'use client'

import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useClientStore } from "@/stores/client-store"

// Schema for validation
const clientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(10, "Phone must be at least 10 digits"),
  address: z.string().optional(),
  note: z.string().optional(),
})

type ClientFormData = z.infer<typeof clientSchema>

const onAdd = (data: ClientFormData) => {
  window.debug.log(data)
  useClientStore.getState().addClient({ ...data, id: crypto.randomUUID() })
}


export function AddClientDialog() {
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
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="default">+ New Client</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name" className="mb-2">Full Name</Label>
            <Input {...form.register("name")} placeholder="John Doe" />
            {form.formState.errors.name && <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>}
          </div>

          <div>
            <Label htmlFor="email" className="mb-2">Email</Label>
            <Input {...form.register("email")} placeholder="john@example.com" />
            {form.formState.errors.email && <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>}
          </div>

          <div>
            <Label htmlFor="phone" className="mb-2">Phone</Label>
            <Input {...form.register("phone")} placeholder="+91 1234567890" />
            {form.formState.errors.phone && <p className="text-sm text-red-500">{form.formState.errors.phone.message}</p>}
          </div>

          <div>
            <Label htmlFor="address" className="mb-2">Address</Label>
            <Input {...form.register("address")} placeholder="123 Street Name, City" />
          </div>

          <div>
            <Label htmlFor="note">Description</Label>
            <textarea
              id="note"
              {...form.register("note")}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Optional description..."
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="submit">Add Client</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
