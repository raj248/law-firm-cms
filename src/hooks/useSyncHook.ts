import { useEffect } from 'react'
import { useSyncStore } from '@/stores/sync-store'
import { supabase } from '@/supabase/supabase'
import { toast } from 'sonner'
import { handleClientRealtimePayload, pullAllClients } from '@/supabase/syncClients'
import { handleCaseRealtimePayload, pullAllCases } from '@/supabase/syncCases'
import { pushClients } from '@/supabase/cloud-clients'
import { pushCases } from '@/supabase/cloud-cases'
import { handleSettingsRealtimePayload, pullAllSettings } from '@/supabase/syncSettings'
import { pushSettings } from '@/supabase/cloud-settings'
import { handleAuditRealtimePayload, pullAllAudits } from '@/supabase/syncAudits'

export function useSyncHook() {
  useEffect(() => {
    let subs_clients: ReturnType<typeof supabase.channel> | null = null
    let subs_cases: ReturnType<typeof supabase.channel> | null = null
    let subs_courts: ReturnType<typeof supabase.channel> | null = null
    let subs_tags: ReturnType<typeof supabase.channel> | null = null
    let subs_audits: ReturnType<typeof supabase.channel> | null = null

    const syncAndSubscribe = async () => {
      const { setRealtimeActive } = useSyncStore.getState()

      await pullAllClients()
      await pullAllCases()
      await pullAllSettings()
      await pullAllAudits()

      await pushClients()
      await pushCases()
      await pushSettings()
      
      toast.success('Sync complete. Subscribing to realtime...')

      // Setup realtime subscriptions
      
      subs_clients?.joinedOnce? subs_clients = supabase.channel('realtime-clients')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, (payload) => {
          window.debug.log('📡 Realtime client change:', payload)
          handleClientRealtimePayload(payload)
        })
        .subscribe(() => {
          setRealtimeActive(true)
          window.debug.log("Subscribed to Clients")
        }): window.debug.log("Client Channel Already Connected")

      subs_cases?.joinedOnce? subs_cases = supabase.channel('realtime-cases')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'cases' }, (payload) => {
          window.debug.log('📡 Realtime case change:', payload)
          handleCaseRealtimePayload(payload)
        })
        .subscribe(() => {
          setRealtimeActive(true)
          window.debug.log("Subscribed to Cases")
        }): window.debug.log("Cases Channel Already Connected")

      subs_courts?.joinedOnce? subs_courts = supabase.channel('realtime-courts')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'courts' }, (payload) => {
          window.debug.log('📡 Realtime court change:', payload)
          handleSettingsRealtimePayload(payload)
        })
        .subscribe(() => {
          setRealtimeActive(true)
          window.debug.log("Subscribed to Courts")
        }): window.debug.log("Court Channel Already Connected")

      subs_tags?.joinedOnce? subs_tags = supabase.channel('realtime-tags')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tags' }, (payload) => {
          window.debug.log('📡 Realtime tag change:', payload)
          handleSettingsRealtimePayload(payload)
        })
        .subscribe(() => {
          setRealtimeActive(true)
          window.debug.log("Subscribed to Tags")
        }): window.debug.log("Tag Channel Already Connected")

      subs_audits?.joinedOnce? subs_audits = supabase.channel('realtime-audits')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'audits' }, (payload) => {
          window.debug.log('📡 Realtime audit change:', payload)
          handleAuditRealtimePayload(payload)
        })
        .subscribe(() => {
          setRealtimeActive(true)
          window.debug.log("Subscribed to Audits")
        }): window.debug.log("Audit Channel Already Connected")
    }

    const handleOffline = () => {
      window.debug.log('⚠️ Offline. Cleaning up subscriptions.')
      const now = new Date().toISOString()
      useSyncStore.getState().setRealtimeActive(false)
      useSyncStore.getState().setLastSyncedAt(now)

      if (subs_clients) supabase.removeChannel(subs_clients)
      if (subs_cases) supabase.removeChannel(subs_cases)
      if (subs_courts) supabase.removeChannel(subs_courts)
      if (subs_tags) supabase.removeChannel(subs_tags)
      if (subs_audits) supabase.removeChannel(subs_audits)
    }

    const handleReconnect = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        window.debug.log("🔒 No valid session on reconnect, skipping sync.")
        return
      }
      toast.message('🔗 Reconnected', { description: 'Resyncing...' })
      await syncAndSubscribe()
    }

    // Also sync on SIGNED_IN event
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        window.debug.log("🔑 User logged in. Starting sync.")
        syncAndSubscribe()
      }
    })

    // Cleanup listeners and subscriptions on unmount
    window.addEventListener('online', handleReconnect)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('beforeunload', handleOffline)

    return () => {
      window.removeEventListener('online', handleReconnect)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('beforeunload', handleOffline)
      authListener?.subscription.unsubscribe()
      handleOffline()
    }
  }, [])
}
