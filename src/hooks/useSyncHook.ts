import { useEffect } from 'react'
import { syncClientsToSupabase } from '@/supabase/syncClients'
import { toast } from 'sonner'

export function useSyncHook() {
  useEffect(() => {
    const syncOnReconnect = () => {
      toast.info('🔗 Reconnected, syncing clients')
      syncClientsToSupabase()
    }

    // Initial sync if online
    if (navigator.onLine) syncClientsToSupabase()

    // Listen to reconnect
    window.addEventListener('online', syncOnReconnect)

    return () => {
      window.removeEventListener('online', syncOnReconnect)
    }
  }, [])
}
