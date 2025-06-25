import { create } from "zustand";

interface DialogStore {
  // Client dialog
  selectedclient_id: string | null;
  isClientDialogOpen: boolean;
  openClientDialog: (id: string) => void;
  closeClientDialog: () => void;

  // Case dialog
  selectedCaseId: string | null;
  isCaseDialogOpen: boolean;
  openCaseDialog: (id: string) => void;
  closeCaseDialog: () => void;

  // Task
  selectedTaskId: string | null;
  isTaskDialogOpen: boolean;
  openTaskDialog: (id: string) => void;
  closeTaskDialog: () => void;
}

export const useDialogStore = create<DialogStore>((set) => ({
  selectedclient_id: null,
  isClientDialogOpen: false,
  openClientDialog: (id) => set({ selectedclient_id: id, isClientDialogOpen: true }),
  closeClientDialog: () => set({ selectedclient_id: null, isClientDialogOpen: false }),

  selectedCaseId: null,
  isCaseDialogOpen: false,
  openCaseDialog: (id) => set({ selectedCaseId: id, isCaseDialogOpen: true }),
  closeCaseDialog: () => set({ selectedCaseId: null, isCaseDialogOpen: false }),

  selectedTaskId: null,
  isTaskDialogOpen: false,
  openTaskDialog: (id) => set({ selectedTaskId: id, isTaskDialogOpen: true }),
  closeTaskDialog: () => set({ selectedTaskId: null, isTaskDialogOpen: false }),
}))
