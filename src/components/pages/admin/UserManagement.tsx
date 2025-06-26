"use client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { ColumnDef } from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table"
import { useEffect, useMemo, useState } from "react"
import { User } from "@/types"
import { addUser, deleteUser, loadUsers, updateRole } from "@/supabase/admin/user-management"
import { formatDistanceToNow } from "date-fns"
import { Trash } from "lucide-react"

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  useEffect(() => {
    const f = async () => {
      const users = await loadUsers() as User[]
      setUsers(users)
    }
    f()

  }, [])
  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => <div>{row.original.name}</div>,
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => <div>{row.original.email}</div>,
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => (
          <Select
            value={row.original.role}
            onValueChange={(val) => updateRole(row.original.id, val)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
            </SelectContent>
          </Select>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <div>{row.original.user_id ? "Active" : "Inactive"}</div>,
      },
      {
        accessorKey: "created_at",
        header: "Created At",
        cell: ({ row }) => <div>{formatDistanceToNow(row.original.created_at, { addSuffix: true })}</div>,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button
            variant="destructive"
            className="text-sm"
            onClick={() => deleteUser(row.original.id)}
          >
            <Trash className="h-5 w-5" />
          </Button>
        ),
      },
    ],
    [updateRole, deleteUser]
  )

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold mb-4">User Management</h2>
        <AddUserDialog />
      </div>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <TableHead key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map(row => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map(cell => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}


const formSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1, "Name is required"),
  role: z.enum(["admin", "staff"]),
})

type FormData = z.infer<typeof formSchema>

function AddUserDialog({ onUserAdded }: { onUserAdded?: () => void }) {
  const [open, setOpen] = useState(false)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: "staff",
    },
  })

  const onSubmit = async (data: FormData) => {
    addUser(data.name, data.email, data.role)
    reset()
    setOpen(false)
    loadUsers()
    onUserAdded?.()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">➕ Add User</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label className="mb-2">Email</Label>
            <Input type="email" {...register("email")} />
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </div>
          <div>
            <Label className="mb-2">Name</Label>
            <Input type="text" {...register("name")} />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>
          <div>
            <Label className="mb-2">Role</Label>
            <select
              {...register("role")}
              className="border rounded w-full p-2 bg-background text-foreground"
            >
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
            </select>
            {errors.role && <p className="text-sm text-red-500">{errors.role.message}</p>}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
