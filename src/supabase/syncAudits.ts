import { supabase } from '@/supabase/supabase'
import { toast } from 'sonner'
import { useUserStore } from "@/stores/user-store"
import { useAuditStore } from "@/stores/audit-store"
import { Audit } from "@/types"
import { useSyncStore } from '@/stores/sync-store'

export async function pullAllAudits() {
  const { currentUser } = useUserStore.getState()

  const { data: audits, error } = await supabase.from('audits').select('*')

  if (error) {
    toast.error('❌ Pull failed', { description: error.message })
    return
  }

  if (!audits) return

  // ✅ Filter out audits created by current user
  const filteredAudits = audits.filter(audit => audit.user_id !== currentUser?.id)

  // ✅ Add is_synced: 1 to each pulled audit
  const auditsWithSync = filteredAudits.map(audit => ({
    ...audit,
    is_synced: 1
  })) as Audit[]

  if (auditsWithSync.length > 0) {
    for (const audit of auditsWithSync) {
      const res = await window.database.insertAudit(audit)
      window.debug.log("Inserted/Updated audits locally:", res)
    }

    toast.success("✅ Audits Pulled", { description: `Synced ${auditsWithSync.length} audits from Supabase` })
  } else {
    window.debug.log("No audits to sync for other users.")
  }
}


export async function pushAudits(): Promise<void> {
  const unsyncedAudits = await window.database.unsyncedAudits()

  if (unsyncedAudits.length === 0) {
    // toast.info("All Audits Already Synced")
    return
  }

  // toast.info("Sync Started", { description: `🔄 Syncing ${unsyncedAudits.length} audits to Supabase...` })

  for (const audit of unsyncedAudits) {
    const { error } = await supabase.from('audits').insert({
      id: audit.id,
      created_at: audit.created_at,
      user_id: audit.user_id,
      user_name: audit.user_name,
      action_type: audit.action_type,
      object_type: audit.object_type,
      object_id: audit.object_id,
      // Do NOT include is_synced as it does not exist on Supabase
    })

    if (error) {
      toast.error("Error", { description: `❌ Failed to sync audit (${audit.action_type} on ${audit.object_type}): ${error.message}` })
    } else {
      window.database.updateAuditSync(audit.id)
      toast.success("Synced", { description: `✅ Synced audit (${audit.action_type} on ${audit.object_type})` })
    }
  }

  // window.debug.log('📦 Local Audits updated with synced status.')
}


export function handleAuditRealtimePayload(payload: any) {
  const { eventType, new: newAudit, old: oldAudit } = payload

  const currentUserId = useUserStore.getState().currentUser?.id

  // Skip processing if the audit is from the current user
  if (newAudit?.user_id === currentUserId) {
    window.debug.log(`🛑 Skipped audit ${newAudit.id} from current user ${currentUserId}`)
    return
  }

  // Trigger notification
  useSyncStore.getState().setNewAuditNotification(true)

  if (eventType === 'INSERT') {
    const audit: Audit = {
      ...newAudit,
      is_synced: 1, // mark synced locally
    }

    // Insert or update in local SQLite
    window.database.insertAudit(audit)

    // Refresh local Zustand audit store
    useAuditStore.getState().fetchAudits()
  }

  window.debug.log(
    `🔄 Handled ${eventType} for audit`,
    eventType === 'DELETE' ? oldAudit.id : newAudit.id
  )
}