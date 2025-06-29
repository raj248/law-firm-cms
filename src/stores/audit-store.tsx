import { create } from "zustand"
import { persist } from "zustand/middleware"
import { supabase } from "@/supabase/supabase"
import { Audit } from "@/types"

interface AuditStoreState {
  audits: Audit[]
  loading: boolean
  error: string | null

  fetchAudits: () => Promise<void>
  pushAudits: () => Promise<void>
  addAudit: (audit: Audit) => Promise<void>
  clearAudits: () => void
}

export const useAuditStore = create<AuditStoreState>()(
  persist(
    (set, get) => ({
      audits: [],
      loading: false,
      error: null,

      fetchAudits: async () => {
        set({ loading: true, error: null })
        try {
          const audits = await window.database.getAllAudits()
          set({ audits, loading: false })
          // window.debug.log("Fetched audits: ", audits)
        } catch (e) {
          set({ error: String(e), loading: false })
        }
      },

      pushAudits: async () => {
        try {
          const audits = await window.database.unsyncedAudits()
          if (audits.length === 0) return

          // Remove `is_synced` before pushing to Supabase
          const auditsToPush = audits.map(({ is_synced, ...rest }) => rest)

          const { error } = await supabase.from("audits").insert(auditsToPush)

          if (error) {
            set({ error: error.message })
            window.debug.log("Error pushing audits: ", error)
            return
          }

          // Mark as synced locally after successful push
          audits.forEach((audit) => window.database.updateAuditSync(audit.id))

          await get().fetchAudits()
        } catch (e) {
          set({ error: String(e) })
          window.debug.log("Error in pushAudits:", e)
        }
      },


      addAudit: async (audit: Audit) => {
        try {
          const res = await window.database.insertAudit(audit)
          if (!res.success) {
            set({ error: res.error ?? "Failed to add audit." })
          } else {
            await get().fetchAudits()
          }
        } catch (e) {
          set({ error: String(e) })
        }
      },

      clearAudits: () => {
        set({ audits: [] })
      },
    }),
    {
      name: "audit-store",
      partialize: (state) => ({
        audits: state.audits
      }),
    }
  )
)
