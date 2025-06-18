// useDeleteDialogStore.ts
import { Client } from "@/types"
import { create } from "zustand"

type DeleteDialogStore = {
  isOpen: boolean
  item: Client | null
  open: (client: Client) => void
  close: () => void
}

export const useDeleteDialogStore = create<DeleteDialogStore>((set) => ({
  isOpen: false,
  item: null,
  open: (client) => set({ isOpen: true, item: client }),
  close: () => set({ isOpen: false, item: null }),
}))
