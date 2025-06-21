import { create } from 'zustand'
import { Case } from '@/types'
import { toast } from 'sonner'

type CaseStore = {
  cases: Case[]
  fetchCases: () => Promise<void>
  addCase: (legalCase: Case) => Promise<void>
  deleteCase: (id: string) => Promise<void>
  updateCase: (id: string, field: keyof Case, value: any) => Promise<void>
  getCaseById: (id: string) => Case | undefined
  getCasesByClientId: (clientId: string) => Case[] | undefined
}

export const useCaseStore = create<CaseStore>((set, get) => ({
  cases: [],

  fetchCases: async () => {
    const data = await window.database.getAllCases()
    window.debug.log("Fetched cases: ", data)
    const parsed = data.map((c: any) => ({
      ...c,
      tags: c.tags ? JSON.parse(c.tags) : [],
    }))
    set({ cases: parsed })
  },

  addCase: async (legalCase) => {
    const result = await window.database.insertCase(legalCase)
    window.debug.log("Added case: ", result)
    if (result.success) {
      set((state) => ({ cases: [...state.cases, legalCase] }))
      toast.success("Case added", { description: legalCase.title })

    } else {
      toast.error("Error", { description: result.error })
    }
  },

  deleteCase: async (id) => {
    const result = await window.database.deleteCase(id)
    if (result.success) set((state) => ({
      cases: state.cases.filter((c) => c.id !== id),
    }))
    result.success ? toast.success("Case deleted", { description: "Case has been deleted" }) : toast.error("Error", { description: "Case not found" })

  },

  updateCase: async (id: string, field: keyof Case, value: any) => {
    const caseToUpdate = get().cases.find(c => c.id === id)
    if (!caseToUpdate) {
      toast.error("Error", { description: "Case not found" })
      return
    }

    const result = await window.database.updateCase(id, field, value) // INSERT OR REPLACE

    if (result.success && result.updatedCase) {
      set((state) => ({
        cases: state.cases.map((c) =>
          c.id === id ? result.updatedCase : c
        ),
      }))
      window.debug.log("Updated case: ", result.updatedCase)
      toast.success("Case updated", {
        description: `${field} updated successfully`
      })
    } else {
      toast.error("Error", { description: result.error })
    }
  },

  getCaseById: (id) => get().cases.find((c) => c.id === id),
  getCasesByClientId: (clientId) => get().cases.filter((c) => c.clientId === clientId),
}))
