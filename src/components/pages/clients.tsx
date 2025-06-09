// app/(dashboard)/clients/page.tsx or similar route
import { clientColumns } from "@/components/columns/client-columns"
import { DataTable } from "@/components/data-table" // the reusable DataTable
import type { Client } from "@/components/columns/client-columns"

const clients: Client[] = [
  { id: "1", name: "John Doe", email: "john@example.com", phone: "9876543210", cases: 3 },
  { id: "2", name: "Jane Smith", email: "jane@example.com", phone: "9123456789", cases: 1 },
  // Add more here or load from DB
]

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Clients</h2>
        <p className="text-muted-foreground">Manage all your client records here.</p>
      </div>

      <DataTable columns={clientColumns} data={clients} />
    </div>
  )
}
