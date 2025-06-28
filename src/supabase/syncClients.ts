import { useClientStore } from '@/stores/client-store'
import { useSyncStore } from '@/stores/sync-store'
import { supabase } from '@/supabase/supabase'
import { Client } from '@/types'
import { toast } from 'sonner'

export async function pullClients(lastSyncTime: string): Promise<void> {
  window.debug.log(lastSyncTime)
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .gt('updated_at', lastSyncTime)

  if (error) {
    toast.error('❌ Pull failed', {description: error.message})
    return
  }
  window.debug.log(data)

  if(!data) return
  window.database.insertOrUpdateClients(data as Client[])

  const newSyncTime = new Date().toISOString()
  useSyncStore.getState().setLastSyncedAt(newSyncTime)
  useClientStore.getState().fetchClients()
  // toast.success(`✅ Pulled ${data.length} client(s)`)
  return
}

export async function pullAllClients() {
  const { data: clients, error } = await supabase.from('clients').select('*')

  if (error) {
    toast.error('❌ Pull failed', { description: error.message })
    return
  }

  if (!clients) return

  const remoteClientIds = clients.map(c => c.id)
  
  // 🔽 STEP 1: Get all local client IDs
  const localClients = await window.database.getAllClients() // You need to define this
  const localClientIds = localClients.map(c => c.id)

  // 🔽 STEP 2: Find local clients that were deleted remotely
  const deletedClientIds = localClientIds.filter(id => !remoteClientIds.includes(id))
  // window.debug.log(remoteClientIds, localClientIds, deletedClientIds)

  // 🔽 STEP 3: Delete them from local DB
  if (deletedClientIds.length > 0) {
    for(const id of deletedClientIds) {
      window.debug.log("Id to delete: ",id)
      const res = await window.database.deleteClient(id)
      window.debug.log("Deleted clients locally:", id, " : ", res)
      
    }
  }

  // 🔽 STEP 4: Upsert remaining clients
  window.database.insertOrUpdateClients(clients as Client[])

  // 🔽 Final update
  useClientStore.getState().fetchClients()
  const newSyncTime = new Date().toISOString()
  useSyncStore.getState().setLastSyncedAt(newSyncTime)
  toast.info("Clients Synced")
}


export function handleClientRealtimePayload(payload: any) {
  const { eventType, new: newClient, old: oldClient } = payload

  if (eventType === 'INSERT' || eventType === 'UPDATE') {
    window.database.insertOrUpdateClients([newClient,] as Client[])

    // update zustand store
    useClientStore.getState().fetchClients()
  }
  
  if (eventType === 'DELETE') {
    useClientStore.getState().deleteClient(oldClient.id as string)
    
    // update zustand store
    useClientStore.getState().fetchClients()
  }

  window.debug.log(
    `🔄 Handled ${eventType} for client`, 
    eventType === 'DELETE' ? oldClient.id : newClient.id
  )
}