import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type SyncState = {
  lastSyncedAt: string
  isRealTimeActive: boolean
  setLastSyncedAt: (ts: string) => void
  setRealtimeActive: (val: boolean) => void
  resetLastSyncedAt: () => void
  clear: () => void
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      lastSyncedAt: '1970-01-01T00:00:00Z',
      isRealTimeActive: false,
      setLastSyncedAt: (ts) => set({ lastSyncedAt: ts }),
      setRealtimeActive: (val) => set({ isRealTimeActive: val }),
      resetLastSyncedAt: () => set({ lastSyncedAt: '1970-01-01T00:00:00Z' }),
      clear: (): any => useSyncStore.persist.clearStorage()
    }),
    {
      name: 'sync-store', // key in localStorage
      partialize: (state) => ({
        lastSyncedAt: state.lastSyncedAt, // only persist this
      }),
    }
  )
)
