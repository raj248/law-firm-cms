import { create } from 'zustand'
import { Case } from '@/types'
import { toast } from 'sonner'

type CaseStore = {
  cases: Case[]
  fetchCases: () => Promise<void>
  addCase: (legalCase: Case) => Promise<void>
  deleteCase: (id: string) => Promise<void>
  updateCase: (id: string, data: Partial<Case>) => Promise<void>
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
    await window.database.deleteCase(id)
    set((state) => ({
      cases: state.cases.filter((c) => c.id !== id),
    }))
  },

  updateCase: async (id, data) => {
    const caseToUpdate = get().cases.find(c => c.id === id)
    if (!caseToUpdate) return

    const updated = { ...caseToUpdate, ...data, tags: JSON.stringify(data.tags ?? caseToUpdate.tags ?? []) }
    const result = await window.database.insertCase(updated) // INSERT OR REPLACE

    if (result.success) {
      set((state) => ({
        cases: state.cases.map((c) => (c.id === id ? { ...c, ...data } : c)),
      }))
    } else {
      toast.error("Error", { description: result.error })
    }
  },

  getCaseById: (id) => get().cases.find((c) => c.id === id),
  getCasesByClientId: (clientId) => get().cases.filter((c) => c.clientId === clientId),
}))
