import { useEffect } from 'react'
import { handleClientRealtimePayload, pullClients, pushClients } from '@/supabase/syncClients'
import { useSyncStore } from '@/stores/sync-store'
import { supabase } from '@/supabase/supabase'
import { toast } from 'sonner'

export function useSyncHook() {
  useEffect(() => {
    let subscription: ReturnType<typeof supabase.channel> | null = null

    const syncAndSubscribe = async () => {
      const { lastSyncedAt, setRealtimeActive } = useSyncStore.getState()

      toast.info('🔄 Syncing from Supabase...')
      await pullClients(lastSyncedAt)

      toast.info('⏫ Pushing local changes...')
      await pushClients()

      toast.success('✅ Sync complete. Subscribing to realtime...')

      // Subscribe to realtime
      subscription = supabase
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
    }

    const handleOffline = () => {
      window.debug.log('⚠️ Offline. Cleaning up realtime and saving sync time.')
      const now = new Date().toISOString()
      useSyncStore.getState().setRealtimeActive(false)
      useSyncStore.getState().setLastSyncedAt(now)
      if (subscription) supabase.removeChannel(subscription)
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
      if (subscription) supabase.removeChannel(subscription)
    }
  }, [])
}
