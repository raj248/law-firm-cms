import { useSyncStore } from '@/stores/sync-store'
import { useCaseStore } from '@/stores/case-store'
import { supabase } from '@/supabase/supabase'
import { Case } from '@/types'
import { toast } from 'sonner'



export async function pullCases(lastSyncTime: string): Promise<void> {
  const { data, error } = await supabase
    .from('cases')
    .select('*')
    .gt('updated_at', lastSyncTime)

  if (error) {
    toast.error('❌ Pull failed', { description: error.message })
    return
  }

  if (!data) return
  window.database.insertOrUpdateCases(data as Case[])

  const newSyncTime = new Date().toISOString()
  useSyncStore.getState().setLastSyncedAt(newSyncTime)
  useCaseStore.getState().fetchCases()

  // toast.success(`✅ Pulled ${data.length} case(s)`)
}


export async function pullAllCases(): Promise<void> {
  const { data: cases, error } = await supabase.from('cases').select('*')

  if (error) {
    toast.error('❌ Pull failed', { description: error.message })
    return
  }

  if (!cases) return

  const remoteCaseIds = cases.map(c => c.file_id)

  // 🔽 Get all local case IDs
  const localCases = await window.database.getAllCases() // You must define this
  const localCaseIds = localCases.map((c: Case) => c.file_id)

  // 🔽 Find locally present cases that are deleted on Supabase
  const deletedCaseIds = localCaseIds.filter((file_id: string) => !remoteCaseIds.includes(file_id))
  // window.debug.log(localCaseIds, remoteCaseIds, deletedCaseIds)
  // 🔽 Delete them from local DB
  if (deletedCaseIds.length > 0) {
    for (const id of deletedCaseIds) {
      const res = await window.database.deleteCase(id)
      window.debug.log("Deleted cases locally:", id, ":", res)
    }
  }
  // 🔽 Insert or update all remote cases into local DB
  window.database.insertOrUpdateCases(cases as Case[])

  // 🔽 Final steps
  const newSyncTime = new Date().toISOString()
  useSyncStore.getState().setLastSyncedAt(newSyncTime)
  useCaseStore.getState().fetchCases()
  toast.info("Cases Synced")
}


export function handleCaseRealtimePayload(payload: any) {
  const { eventType, new: newCase, old: oldCase } = payload

  if (eventType === 'INSERT' || eventType === 'UPDATE') {
    window.database.insertOrUpdateCases([newCase,] as Case[])
    useCaseStore.getState().fetchCases()
  }

  if (eventType === 'DELETE') {
    useCaseStore.getState().deleteCase(oldCase.id as string)
    useCaseStore.getState().fetchCases()
  }

  window.debug.log(
    `🔄 Handled ${eventType} for case`,
    eventType === 'DELETE' ? oldCase.id : newCase.id
  )
}
