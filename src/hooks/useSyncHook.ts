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
      const {  setRealtimeActive } = useSyncStore.getState()

      toast.info('🔄 Syncing from Supabase...')
      await pullAllClients()
      await pullAllCases()
      await pullAllSettings()
      await pullAllAudits()

      // toast.info('⏫ Pushing local changes...')
      await pushClients()
      await pushCases()
      await pushSettings()
      // await 

      toast.success('✅ Sync complete. Subscribing to realtime...')
      const client_channel = supabase.channel('realtime-clients')
      const case_channel = supabase.channel('realtime-cases')
      const court_channel = supabase.channel('realtime-courts')
      const tag_channel = supabase.channel('realtime-tags')
      const audit_channel = supabase.channel('realtime-tags')

      
      // Subscribe to realtime
      client_channel.joinedOnce?
      window.debug.log("Client Already subscribed")
      :
      subs_clients = client_channel
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
          window.debug.log("Subsribed Clients...")
        })

      case_channel.joinedOnce?
      window.debug.log("Case Already subscribed")
      :
       subs_cases = case_channel // ✅ can be named anything
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
          window.debug.log('Subscribed Cases...')
        })
        
        court_channel.joinedOnce ? 
        window.debug.log("Court Already subscribed")
        :
        subs_courts = court_channel
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'courts',
        }, (payload) => {
          window.debug.log('📡 Realtime change:', payload)
          handleSettingsRealtimePayload(payload)
          // handle the payload or set a flag to refetch
        })
        .subscribe(() => {
          setRealtimeActive(true)
          window.debug.log('Subscribed COurts...')
        })

      tag_channel.joinedOnce? 
      window.debug.log("Tag Already subscribed")
      :
      subs_tags = tag_channel
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'tags',
        }, (payload) => {
          window.debug.log('📡 Realtime change:', payload)
          handleSettingsRealtimePayload(payload)
          // handle the payload or set a flag to refetch
        })
        .subscribe(() => {
          setRealtimeActive(true)
          window.debug.log("Subsribed Tags...")
        })

      audit_channel.joinedOnce? 
      window.debug.log("Tag Already subscribed")
      :
      subs_audits = audit_channel
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'audits',
        }, (payload) => {
          window.debug.log('📡 Realtime change:', payload)
          handleAuditRealtimePayload(payload)
          // handle the payload or set a flag to refetch
        })
        .subscribe(() => {
          setRealtimeActive(true)
          window.debug.log("Subsribed Audits...")
        })
    }

    const handleOffline = () => {
      window.debug.log('⚠️ Offline. Cleaning up realtime and saving sync time.')
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
      if (subs_courts) supabase.removeChannel(subs_courts)
      if (subs_tags) supabase.removeChannel(subs_tags)
      if (subs_audits) supabase.removeChannel(subs_audits)
    }
  }, [])
}
