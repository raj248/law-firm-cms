import { create } from 'zustand'
import { Client } from '@/types'
import { toast } from 'sonner'

type ClientStore = {
  clients: Client[]
  fetchClients: () => Promise<void>
  addClient: (client: Client) => Promise<void>
  deleteClient: (id: string) => Promise<void>
  updateClient: (id: string, field: keyof Client, value: string) => Promise<void>
}

export const useClientStore = create<ClientStore>((set) => ({
  clients: [],
  fetchClients: async () => {
    const data = await window.database.getAllClients()
    set({ clients: data })
  },
  addClient: async (client) => {
    const result = await window.database.insertClient(client)
    if (result.success) {
      set((state) => ({ clients: [...state.clients, client] }))
    } else {
      toast.error("Error", { description: result.error })
    }
  },
  updateClient: async (id: string, field: keyof Client, value: string) => {
    const success = await window.database.updateClientField(id, field, value)
    if (success) {
      set((state) => ({
        clients: state.clients.map((c) =>
          c.id === id ? { ...c, [field]: value } : c
        )
      }))
      toast.success("Client updated", {
        description: `${field} updated successfully`
      })
    } else {
      toast.error("Update failed", {
        description: `Could not update ${field}`
      })
    }
  },
  deleteClient: async (id) => {
    const success = await window.database.deleteClient(id)
    if (success) set((state) => ({
      clients: state.clients.filter((c) => c.id !== id)
    }));

    success ? toast.success("Client deleted", { description: "Client has been deleted" }) : toast.error("Error", { description: "Client not found" })
  }
}))

// For update client
// set((state) => ({
//   clients: state.clients.map((c) => c.id === client.id ? client : c)
// }))
