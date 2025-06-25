import { create } from 'zustand'
import { Client, NewClient } from '@/types'
import { toast } from 'sonner'
import { pushClients } from '@/supabase/push-clients'

type ClientStore = {
  clients: Client[]
  fetchClients: () => Promise<void>
  addClient: (client: NewClient) => Promise<void>
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
    if (result.success && result.data) {

      set((state) => ({ clients: [...state.clients, result.data] }))
      toast.success("Client added", { description: "Client has been added" })
      pushClients()
    } else {
      toast.error("Error", { description: result.error })
    }
  },
  updateClient: async (id: string, field: keyof Client, value: string) => {
    const result = await window.database.updateClientField(id, field, value)
    if (result.success) {
      set((state) => ({
        clients: state.clients.map((c) =>
          c.id === id ? { ...c, [field]: value } : c
        )
      }))
      toast.success("Client updated", {
        description: `${field} updated successfully`
      })
      pushClients()
    } else {
      toast.error("Update failed", {
        description: `Could not update ${field}`
      })
    }
  },
  deleteClient: async (id) => {
    const result = await window.database.deleteClient(id)
    if (result.success) {
      set((state) => ({
        clients: state.clients.filter((c) => c.id !== id)
      }))
      toast.success("Client deleted", { description: "Client has been deleted" })
      pushClients()
    } else {
      toast.error("Error", { description: "Client not found" })
    }
  }
}))

// For update client
// set((state) => ({
//   clients: state.clients.map((c) => c.id === client.id ? client : c)
// }))
