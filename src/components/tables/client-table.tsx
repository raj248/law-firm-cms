"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Client } from "@/types"
import { useClientStore } from "@/stores/client-store"
import { toast } from "sonner"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog"
import { AddClientDialog } from "../dialogs/add/add-client-dialog"
import { formatDistanceToNow } from "date-fns"
import { ClientDetailDialog } from "../dialogs/details/client-detail-dialog"

const COLUMN_VISIBILITY_KEY = "client-table-column-visibility"

const getInitialVisibility = (): VisibilityState => {
  if (typeof window === "undefined") return {}
  const stored = localStorage.getItem(COLUMN_VISIBILITY_KEY)
  return stored ? JSON.parse(stored) : {}
}

export function ClientTable() {
  const columns: ColumnDef<Client>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => <div className="capitalize">{row.getValue("name")}</div>,
      filterFn: 'includesString',
    },
    {
      accessorKey: "phone",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Phone <ArrowUpDown />
        </Button>
      ),
      filterFn: 'includesString',
      cell: ({ row }) => <div>{row.getValue("phone")}</div>,
    },
    {
      accessorKey: "email",
      header: "Email",
      filterFn: 'includesString',
      cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>,
    },
    {
      accessorKey: "address",
      header: "Address",
      cell: ({ row }) => (
        <div className="truncate max-w-xs" title={row.getValue("address")}>
          {row.getValue("address")}
        </div>
      ),
    },
    {
      accessorKey: "note",
      header: "Note",
      cell: ({ row }) => (
        <div className="truncate max-w-xs" title={row.getValue("note")}>
          {row.getValue("note")}
        </div>
      ),
    },
    {
      accessorKey: "updated_at",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Last Updated <ArrowUpDown />
        </Button>
      ),
      filterFn: 'includesString',
      cell: ({ row }) => <div>{formatDistanceToNow(new Date(row.getValue("updated_at")), { addSuffix: true })}</div>,
    },
    {
      id: "actions",
      enableHiding: true,
      cell: ({ row }) => {
        const client = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0"
                onClick={() => console.log("Dropdown Trigger Clicked")}
              >
                <span className="sr-only">Open menu</span>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-50">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  navigator.clipboard.writeText(client.id)
                  toast("Copied", { description: "Client ID copied to clipboard" })
                }}
              >
                Copy Client ID
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {client.email && (<DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  navigator.clipboard.writeText(client.email)
                  toast("Copied", { description: "Email copied to clipboard" })
                }}
              >
                Copy Email
              </DropdownMenuItem>)}

              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  navigator.clipboard.writeText(client.phone)
                  toast("Copied", { description: "Phone number copied to clipboard" })
                }}
              >
                Copy Phone
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  // your appointment logic
                  toast("Scheduled", { description: "Appointment logic executed" })
                }}
              >
                Schedule Appointment
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  // delete logic
                  setClientToDelete(client)
                  setIsAlertDialogOpen(true)
                }}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = React.useState<any>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(getInitialVisibility)
  const [rowSelection, setRowSelection] = React.useState({})
  const client = useClientStore((s) => s.clients)
  const [selectedClient, setSelectedClient] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);
  const [clientToDelete, setClientToDelete] = React.useState<Client | null>(null)
  const [isAlertDialogOpen, setIsAlertDialogOpen] = React.useState(false)


  const table = useReactTable<Client>({
    data: client,
    columns,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    globalFilterFn: 'includesString',
    state: {
      sorting,
      globalFilter,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: 25,
      },
    },
  })

  React.useEffect(() => {
    localStorage.setItem(COLUMN_VISIBILITY_KEY, JSON.stringify(columnVisibility))
  }, [columnVisibility])

  return (
    <div className="w-full">
      <div className="flex justify-between py-4">
        <Input
          placeholder="Filter by name, email, or phone..."
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm bg-muted placeholder:text-muted-foreground focus:bg-muted"
        />

        <div className="flex items-center gap-2">
          <AddClientDialog />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Columns <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table.getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-md border border-border overflow-x-auto scrollbar-custom">
        <Table className="min-w-full text-foreground">
          <TableHeader className="bg-secondary/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-foreground">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row, index) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => {
                    setSelectedClient(row.original.id);
                    setOpen(true);
                  }}
                  className={`cursor-pointer transition-colors ${index % 2 === 0 ? "bg-card/80" : "bg-muted/30"
                    } hover:bg-muted`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3 px-4">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No clients found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-muted-foreground flex-1 text-sm">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} selected
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

      {selectedClient && (
        <ClientDetailDialog
          open={open}
          setOpen={setOpen}
          client_id={selectedClient}
        />
      )}

      <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <AlertDialogContent className="!max-w-screen-md !w-full p-6">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. It will permanently delete Client:{" "}
              <span className="font-semibold text-destructive">
                {clientToDelete?.name}
              </span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (clientToDelete) {
                  useClientStore.getState().deleteClient(clientToDelete.id);
                  setClientToDelete(null);
                  setIsAlertDialogOpen(false);
                }
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>

  )
}
