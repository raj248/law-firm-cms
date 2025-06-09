import { ColumnDef } from "@tanstack/react-table"
import { Case } from "@/types"

export const casesColumns: ColumnDef<Case>[] = [
  {
    accessorKey: "id",
    header: "Case ID",
    cell: ({ row }) => <div className="font-medium">{row.original.id}</div>,
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => row.original.title,
  },
  {
    accessorKey: "clientName",
    header: "Client",
    cell: ({ row }) => row.original.clientName,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status
      const color = status === "Open" ? "text-green-600" : status === "Closed" ? "text-gray-500" : "text-yellow-600"
      return <span className={`font-medium ${color}`}>{status}</span>
    },
  },
  {
    accessorKey: "courtDate",
    header: "Court Date",
    cell: ({ row }) => {
      const date = new Date(row.original.courtDate)
      return date.toLocaleDateString()
    },
  },
  {
    accessorKey: "assignedLawyer",
    header: "Lawyer",
    cell: ({ row }) => row.original.assignedLawyer,
  },
]
