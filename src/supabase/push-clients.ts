import { supabase } from '@/supabase/supabase'
import { toast } from 'sonner'

export async function pushClients(): Promise<void> {

  const unsyncedClients = await window.database.unsyncedClients()

  if (unsyncedClients.length === 0) {
    // toast.info("All Clients Already Synced")
    return
  }

  // toast.info("Sync Started", {description:`🔄 Syncing ${unsyncedClients.length} clients to Supabase...`})
  

  for (const client of unsyncedClients) {
    const { error } = await supabase.from('clients').upsert({
      id: client.id,
      name: client.name,
      phone: client.phone,
      email: client.email,
      address: client.address,
      note: client.note,
      created_at: client.created_at,
      updated_at: client.updated_at,
    })

    if (error) {
      toast.error("Error", {description:`❌ Failed to sync ${client.name}: ${error.message}`})
    } else {
      window.database.updateClientSync(client.id)
      toast.success("Synced", {description: `✅ Synced ${client.name}`})
    }
  }

  window.debug.log('📦 Local database updated with synced status.')
}