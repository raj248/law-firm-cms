import { create } from 'zustand'
import { Case } from '@/types'
import { toast } from 'sonner'
import { deleteCase as deleteCaseFromCloud, pushCases as pushCasesToCloud } from '@/supabase/cloud-cases'
import { createAuditPartial } from '@/lib/audit'

type CaseStore = {
  cases: Case[]
  fetchCases: () => Promise<void>
  addCase: (legalCase: Case) => Promise<void>
  deleteCase: (id: string) => Promise<void>
  updateCase: (id: string, field: keyof Case, value: any) => Promise<void>
  getCaseById: (id: string) => Case | undefined
  getCasesByclient_id: (client_id: string) => Case[] | undefined
}

export const useCaseStore = create<CaseStore>((set, get) => ({
  cases: [],

  fetchCases: async () => {
    const data = await window.database.getAllCases()
    const parsed = data.map((c: any) => ({
      ...c,
      tags: c.tags ? JSON.parse(c.tags) : [],
    }))
    set({ cases: parsed })
  },

  addCase: async (legalCase) => {
    const result = await window.database.insertCase(legalCase)
    // window.debug.log("Added case: ", result)
    if (result.success && result.data) {
      set((state) => ({ cases: [...state.cases, result.data] }))
      toast.success("Case added", { description: legalCase.title })
      pushCasesToCloud()
      await createAuditPartial({
        action_type: "INSERT",
        object_type: "CASE",
        object_id: result.data.file_id,
        object_name: result.data.title,
      })
    } else {
      toast.error("Error", { description: result.error })
    }
  },

  deleteCase: async (id) => {
    const title = get().cases.find((c) => c.file_id === id)?.title
    const resCloud = await deleteCaseFromCloud(id)
    const resLocal = await window.database.deleteCase(id)
    if (resCloud.success && resLocal.success) {
      set((state) => ({
        cases: state.cases.filter((c) => c.file_id !== id),
      }))
      toast.success("Case deleted", { description: "Case has been deleted" })
      await createAuditPartial({
        action_type: "DELETE",
        object_type: "CASE",
        object_id: id,
        object_name: title ?? '',
      })
    }
    else {
      toast.error("Error", { description: resCloud.error?.message || resLocal.error })
    }
  },

  updateCase: async (file_id: string, field: keyof Case, value: any) => {
    const caseToUpdate = get().cases.find(c => c.file_id === file_id)
    if (!caseToUpdate) {
      toast.error("Error", { description: "Case not found" })
      return
    }

    const result = await window.database.updateCase(file_id, field, value) // INSERT OR REPLACE
    const id = field === 'file_id' ? value : file_id
    if (result.success && result.updatedCase) {
      set((state) => ({
        cases: state.cases.map((c) =>
          c.file_id === id
            ? result.updatedCase
            : c
        ),
      }))
      // window.debug.log("Updated case: ", result.updatedCase)
      toast.success("Case updated", {
        description: `${field} updated successfully`
      })
      deleteCaseFromCloud(file_id)
      pushCasesToCloud()
      await createAuditPartial({
        action_type: "UPDATE",
        object_type: "CASE",
        object_id: id,
        object_name: result.updatedCase.title,
      })
      if (field === 'file_id') get().fetchCases()
    } else {
      toast.error("Error", { description: result.error })
    }
  },

  getCaseById: (id) => get().cases.find((c) => c.file_id === id),
  getCasesByclient_id: (client_id) => get().cases.filter((c) => c.client_id === client_id),
}))
