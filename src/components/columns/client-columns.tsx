import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"

export type Client = {
  id: string
  name: string
  email: string
  phone: string
  cases: number
}

export const clientColumns: ColumnDef<Client>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "phone",
    header: "Phone",
  },
  {
    accessorKey: "cases",
    header: "Cases",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const client = row.original
      return (
        <div className="text-right">
          <Button variant="outline" size="sm" onClick={() => alert(`View ${client.name}`)}>
            View
          </Button>
        </div>
      )
    },
  },
]
