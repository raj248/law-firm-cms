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

export async function pullAllClients(){

const { data: clients, error } = await supabase
  .from('clients')
  .select('*')
if (error) {
    toast.error('❌ Pull failed', {description: error.message})
    return
  }
  window.debug.log(clients)

  if(!clients) return
  window.database.insertOrUpdateClients(clients as Client[])

  const newSyncTime = new Date().toISOString()
  useSyncStore.getState().setLastSyncedAt(newSyncTime)
  useClientStore.getState().fetchClients()
  toast.success(`✅ Pulled ${clients.length} client(s)`)
  return
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