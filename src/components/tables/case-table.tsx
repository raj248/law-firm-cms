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
  FilterFn,
  Row,
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
import { Case } from "@/types"
import { useCaseStore } from "@/stores/case-store"
import { CaseDetailDialog } from "../dialogs/details/case-detail-dialog"
import { toast } from "sonner"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog"
import { AddCaseDialog } from "../dialogs/add/add-case-dialog"
import { formatDistanceToNow } from "date-fns"

const COLUMN_VISIBILITY_KEY = "case-table-column-visibility"

const tagIncludes: FilterFn<Case> = (
  row: Row<Case>,
  columnId: string,
  filterValue: string
) => {
  const tags = row.getValue(columnId) as string[]
  if (!Array.isArray(tags)) return false
  return tags.some((tag) =>
    tag.toLowerCase().includes(filterValue.toLowerCase())
  )
}

const getInitialVisibility = (): VisibilityState => {
  if (typeof window === "undefined") return {}
  const stored = localStorage.getItem(COLUMN_VISIBILITY_KEY)
  return stored ? JSON.parse(stored) : {}
}

export function CaseTable() {
  const columns: ColumnDef<Case>[] = [
    {
      accessorKey: "file_id",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          File ID <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      filterFn: 'includesString',
      cell: ({ row }) => <div>{row.getValue("file_id")}</div>,
    },
    {
      accessorKey: "case_id",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Case ID <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      filterFn: 'includesString',
      cell: ({ row }) => <div>{row.getValue("case_id") ?? "---"}</div>,
    },
    {
      accessorKey: "title",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Title <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      filterFn: 'includesString',
      cell: ({ row }) => <div>{row.getValue("title")}</div>,
    },
    {
      accessorKey: "description",
      header: "Description",
      filterFn: 'includesString',
      cell: ({ row }) => (
        <div className="truncate max-w-xs" title={row.getValue("description")}>
          {row.getValue("description")}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("status")}</div>
      ),
    },
    {
      accessorKey: "court",
      header: "Court",
      filterFn: 'includesString',
      cell: ({ row }) => <div>{row.getValue("court")}</div>,
    },
    {
      accessorKey: "tags",
      header: "Tags",
      filterFn: "includesString",
      cell: ({ row }) => {
        const tags: string[] = row.getValue("tags") || []
        return (
          <div className="flex flex-wrap gap-1">
            {tags.length > 0 ? (
              tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs bg-[var(--color-accent)] text-[var(--color-accent-foreground)] rounded-full"
                >
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-muted-foreground text-sm">—</span>
            )}
          </div>
        )
      },
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
      enableHiding: false,
      cell: ({ row }) => {
        const item = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open actions</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-50">

              {row.original.case_id && (<DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  navigator.clipboard.writeText(item.case_id)
                  toast("Copied", { description: "Case ID copied" })
                }
                }
              >
                Copy Case ID
              </DropdownMenuItem>)}

              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  navigator.clipboard.writeText(item.title)
                  toast("Copied", { description: "Case Title copied" })
                }
                }
              >
                Copy Case Title
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  setCaseToDelete(item)
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
  const cases = useCaseStore((s) => s.cases)
  const [selectedCase, setSelectedCase] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);
  const [caseToDelete, setCaseToDelete] = React.useState<Case | null>(null)
  const [isAlertDialogOpen, setIsAlertDialogOpen] = React.useState(false)


  const table = useReactTable({
    data: cases,
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
    filterFns: {
      tagIncludes,
    },
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
          placeholder="Filter by id, title, description, court, or tags..."
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm bg-muted text-foreground placeholder:text-muted-foreground focus:bg-muted"
        />
        <div className="flex items-center gap-2">
          <AddCaseDialog />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className="ml-auto">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-50 bg-popover text-popover-foreground">
              {table
                .getAllColumns()
                .filter((col) => col.getCanHide())
                .map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    className="capitalize"
                    checked={col.getIsVisible()}
                    onCheckedChange={(val) => col.toggleVisibility(!!val)}
                  >
                    {col.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-md border overflow-x-auto scrollbar-custom bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className="text-muted-foreground">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => {
                    setSelectedCase(row.original.file_id);
                    setOpen(true);
                  }}
                  className="hover:bg-muted/30 cursor-pointer"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-foreground">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No cases found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

      {selectedCase && (
        <CaseDetailDialog open={open} setOpen={setOpen} file_id={selectedCase} />
      )}

      <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <AlertDialogContent className="!max-w-screen-md !w-full p-6 bg-popover text-popover-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. It will permanently delete Case:
              <span className="font-semibold text-destructive"> {caseToDelete?.title}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (caseToDelete) {
                  useCaseStore.getState().deleteCase(caseToDelete.file_id);
                  setCaseToDelete(null);
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
