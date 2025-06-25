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
  window.database.insertOrUpdateCases(cases as Case[])

  const newSyncTime = new Date().toISOString()
  useSyncStore.getState().setLastSyncedAt(newSyncTime)
  useCaseStore.getState().fetchCases()

  toast.success(`✅ Pulled ${cases.length} case(s)`)
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
