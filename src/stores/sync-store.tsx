import { create } from 'zustand'

type SyncState = {
  lastSyncedAt: string
  setLastSyncedAt: (time: string) => void
}

export const useSyncStore = create<SyncState>((set) => ({
  lastSyncedAt: '1970-01-01T00:00:00Z',
  setLastSyncedAt: (time) => set({ lastSyncedAt: time }),
}))
