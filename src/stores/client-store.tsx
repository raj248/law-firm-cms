import { create } from 'zustand'
import { Client } from '@/types'
import { toast } from 'sonner'

type ClientStore = {
  clients: Client[]
  fetchClients: () => Promise<void>
  addClient: (client: Client) => Promise<void>
  deleteClient: (id: string) => Promise<void>
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
  deleteClient: async (id) => {
    window.database.deleteClient(id)
    set((state) => ({
      clients: state.clients.filter((c) => c.id !== id)
    }))
  }
}))

// For update client
// set((state) => ({
//   clients: state.clients.map((c) => c.id === client.id ? client : c)
// }))
