import { create } from 'zustand'
import { Client, NewClient } from '@/types'
import { toast } from 'sonner'
import { deleteClient, pushClients } from '@/supabase/cloud-clients'
import { createAuditPartial } from '@/lib/audit'
import { playSound } from '@/utils/sound'

type ClientStore = {
  clients: Client[]
  fetchClients: () => Promise<void>
  addClient: (client: NewClient) => Promise<void>
  deleteClient: (id: string) => Promise<void>
  updateClient: (id: string, field: keyof Client, value: string) => Promise<void>
  getClientById: (id: string) => Client | undefined
}

export const useClientStore = create<ClientStore>((set, get) => ({
  clients: [],
  fetchClients: async () => {
    const data = await window.database.getAllClients()
    set({ clients: data })
  },
  addClient: async (client) => {
    const result = await window.database.insertClient(client)
    if (result.success && result.data) {

      set((state) => ({ clients: [...state.clients, result.data] }))
      toast.success("Client added", { description: `${result.data.name} has been added` })
      playSound('info')
      pushClients()
      await createAuditPartial({
        action_type: "INSERT",
        object_type: "CLIENT",
        object_id: result.data.id,
        object_name: result.data.name,
      })
    } else {
      toast.error("Error", { description: result.error })
      playSound('error')
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
      playSound('info')
      pushClients()
      const name = get().clients.find((c) => c.id === id)?.name
      await createAuditPartial({
        action_type: "UPDATE",
        object_type: "CLIENT",
        object_id: id,
        object_name: name ?? '',
      })
    } else {
      toast.error("Update failed", {
        description: `Could not update ${field}`
      })
      playSound('error')
    }
  },
  deleteClient: async (id) => {
    const name = get().clients.find((c) => c.id === id)?.name
    const resCloud = await deleteClient(id)
    const resLocal = await window.database.deleteClient(id)
    if (resCloud.success && resLocal.success) {
      set((state) => ({
        clients: state.clients.filter((c) => c.id !== id)
      }))
      toast.success("Client deleted", { description: "Client has been deleted" })
      playSound('info')
      await createAuditPartial({
        action_type: "DELETE",
        object_type: "CLIENT",
        object_id: id,
        object_name: name ?? '',
      })
    } else {
      toast.error("Error", { description: resCloud.error?.message || resLocal.error })
      playSound('error')
    }
  },
  getClientById: (id) => get().clients.find((c) => c.id === id),
}))
