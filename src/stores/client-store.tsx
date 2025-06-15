import { Client } from '@/types'
import { create } from 'zustand'


type ClientState = {
  clients: Client[]
  addClient: (client: Client) => void
  updateClient: (id: string, data: Partial<Client>) => void
  deleteClient: (id: string) => void
  setClients: (clients: Client[]) => void
}

export const useClientStore = create<ClientState>((set) => ({
  clients: [],
  addClient: (client) =>
    set((state) => ({ clients: [...state.clients, client] })),
  updateClient: (id, data) =>
    set((state) => ({
      clients: state.clients.map((c) =>
        c.id === id ? { ...c, ...data } : c
      ),
    })),
  deleteClient: (id) =>
    set((state) => ({
      clients: state.clients.filter((c) => c.id !== id),
    })),
  setClients: (clients) => set({ clients }),
}))
