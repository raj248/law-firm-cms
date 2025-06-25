import { useEffect } from 'react'
import { useSyncStore } from '@/stores/sync-store'
import { supabase } from '@/supabase/supabase'
import { toast } from 'sonner'
import { handleClientRealtimePayload, pullClients } from '@/supabase/syncClients'
import { handleCaseRealtimePayload, pullCases } from '@/supabase/syncCases'
import { pushClients } from '@/supabase/push-clients'
import { pushCases } from '@/supabase/push-cases'

export function useSyncHook() {
  useEffect(() => {
    let subs_clients: ReturnType<typeof supabase.channel> | null = null
    let subs_cases: ReturnType<typeof supabase.channel> | null = null

    const syncAndSubscribe = async () => {
      const { lastSyncedAt, setRealtimeActive } = useSyncStore.getState()

      toast.info('🔄 Syncing from Supabase...')
      await pullClients(lastSyncedAt)
      await pullCases(lastSyncedAt)

      // toast.info('⏫ Pushing local changes...')
      await pushClients()
      await pushCases()

      toast.success('✅ Sync complete. Subscribing to realtime...')

      // Subscribe to realtime
      subs_clients = supabase
        .channel('realtime-clients')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'clients',
        }, (payload) => {
          window.debug.log('📡 Realtime change:', payload)
          handleClientRealtimePayload(payload)
          // handle the payload or set a flag to refetch
        })
        .subscribe(() => {
          setRealtimeActive(true)
          window.debug.log("Subsribed...")
        })

      subs_cases = supabase
        .channel('realtime-cases') // ✅ can be named anything
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'cases',
        }, (payload) => {
          window.debug.log('📡 Realtime case change:', payload)
          handleCaseRealtimePayload(payload)
        })
        .subscribe(() => {
          useSyncStore.getState().setRealtimeActive(true)
          window.debug.log('✅ Subscribed to realtime-cases')
        })
    }

    const handleOffline = () => {
      window.debug.log('⚠️ Offline. Cleaning up realtime and saving sync time.')
      const now = new Date().toISOString()
      useSyncStore.getState().setRealtimeActive(false)
      useSyncStore.getState().setLastSyncedAt(now)
      if (subs_clients) supabase.removeChannel(subs_clients)
      if (subs_cases) supabase.removeChannel(subs_cases)
    }

    const handleReconnect = async () => {
      toast.message('🔗 Reconnected', { description: 'Resyncing clients...' })
      await syncAndSubscribe()
    }

    // Initial sync on mount
    if (navigator.onLine) {
      syncAndSubscribe()
    }

    window.addEventListener('online', handleReconnect)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('beforeunload', handleOffline)

    return () => {
      window.removeEventListener('online', handleReconnect)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('beforeunload', handleOffline)
      if (subs_clients) supabase.removeChannel(subs_clients)
      if (subs_cases) supabase.removeChannel(subs_cases)
    }
  }, [])
}
