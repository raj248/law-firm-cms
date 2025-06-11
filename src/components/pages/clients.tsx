import { ClientTable } from "@/components/client-table" // the reusable DataTable

export default function ClientsPage() {
  return (
    <>
      <div>
        <h2 className="text-2xl font-bold">Clients</h2>
        <p className="text-muted-foreground">Manage all your client records here.</p>
      </div>
      <ClientTable />
    </>
  )
}
