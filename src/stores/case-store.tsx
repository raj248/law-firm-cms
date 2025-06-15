import { create } from 'zustand'

export type Case = {
  id: string
  clientId: string
  title: string
  description?: string
  status: 'open' | 'closed' | 'pending'
  hearingDates: string[]
  [key: string]: any
}

type CaseState = {
  cases: Case[]
  addCase: (data: Case) => void
  updateCase: (id: string, data: Partial<Case>) => void
  deleteCase: (id: string) => void
  setCases: (cases: Case[]) => void
}

export const useCaseStore = create<CaseState>((set) => ({
  cases: [],
  addCase: (data) =>
    set((state) => ({ cases: [...state.cases, data] })),
  updateCase: (id, data) =>
    set((state) => ({
      cases: state.cases.map((c) =>
        c.id === id ? { ...c, ...data } : c
      ),
    })),
  deleteCase: (id) =>
    set((state) => ({
      cases: state.cases.filter((c) => c.id !== id),
    })),
  setCases: (cases) => set({ cases }),
}))
