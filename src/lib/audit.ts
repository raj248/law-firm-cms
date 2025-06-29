import { Audit } from "@/types"
import { useUserStore } from "@/stores/user-store"
import { useAuditStore } from "@/stores/audit-store"
import { useSyncStore } from "@/stores/sync-store"

export async function createAuditPartial(
  data: Omit<Audit, "user_id" | "user_name" | "id" | "created_at" | "is_synced">
) {
  const { currentUser } = useUserStore.getState()
  const { isRealTimeActive } = useSyncStore.getState()
  const auditStore = useAuditStore.getState()

  const audit: Audit = {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    user_id: currentUser?.id ?? '',
    user_name: currentUser?.name ?? '',
    ...data,
    is_synced: 0
  }

  // Insert locally
  await auditStore.addAudit(audit)

  // If online, push all unsynced audits to Supabase immediately
  if (isRealTimeActive) {
    await auditStore.pushAudits()
  }
}
