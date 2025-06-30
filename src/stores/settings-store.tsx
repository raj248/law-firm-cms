import { deleteCourt, deleteTag, pushSettings } from '@/supabase/cloud-settings'
import { Court, Tag } from '@/types'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  courts: string[]
  tags: string[]
  setCourts: (courts: string[]) => void
  setTags: (tags: string[]) => void
  fetchCourts: () => Promise<void>
  fetchTags: () => Promise<void>
  addCourt: (court: string) => void
  addTag: (tag: string) => void
  removeCourt: (court: string) => void
  removeTag: (tag: string) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      courts: [],
      tags: [],

      setCourts: (courts) => set({ courts }),
      setTags: (tags) => set({ tags }),

      fetchCourts: async () => {
        try {
          const courts = await window.database.getAllCourts()
          set({ courts: courts.map((c: Court) => c.name) })
        } catch (err) {
          window.debug.log("Failed to fetch courts:", err)
        }
      },

      fetchTags: async () => {
        try {
          const tags = await window.database.getAllTags()
          set({ tags: tags.map((t: Tag) => t.name) })
        } catch (err) {
          window.debug.log("Failed to fetch tags:", err)
        }
      },
      addCourt: (court) => {
        const success = window.database.insertCourt(court)
        success ?? set((state) => ({ courts: [...state.courts, court] }))
        get().fetchCourts()
        // window.debug.log("Added court:", court)
        pushSettings()
      },
      addTag: (tag) => {
        const success = window.database.insertTag(tag)
        success ?? set((state) => ({ tags: [...state.tags, tag] }))
        get().fetchTags()
        // window.debug.log("Added tag:", tag)
        pushSettings()
      },
      // DELETE AND UPDATE NOT IMPLEMENTED
      removeCourt: async (court) => {
        const success = await deleteCourt(court);
        if (success) {
          set((state) => ({
            courts: state.courts.filter((c) => c !== court),
          }));
          pushSettings(); // optional: sync after deletion
        }
      },

      removeTag: async (tag) => {
        const success = await deleteTag(tag);
        if (success) {
          set((state) => ({
            tags: state.tags.filter((t) => t !== tag),
          }));
          pushSettings(); // optional: sync after deletion
        }
      },

    }),
    {
      name: 'settings-store', // LocalStorage key
    }
  )
)
