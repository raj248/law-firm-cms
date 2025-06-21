import { CaseDetailDialog } from "@/components/dialogs/case-detail-dialog"
import { useDialogStore } from "@/stores/dialog-store"
import { ClientDetailDialog } from "./client-detail-dialog"
import { TaskDetailDialog } from "@/components/dialogs/task-detail-dialog"

export const DialogPortal = () => {
  const {
    selectedClientId, isClientDialogOpen, closeClientDialog,
    selectedCaseId, isCaseDialogOpen, closeCaseDialog,
    selectedTaskId, isTaskDialogOpen, closeTaskDialog,
  } = useDialogStore()

  return (
    <>
      {selectedClientId && (
        <ClientDetailDialog
          clientId={selectedClientId}
          open={isClientDialogOpen}
          setOpen={closeClientDialog}
        />
      )}

      {selectedCaseId && (
        <CaseDetailDialog
          caseId={selectedCaseId}
          open={isCaseDialogOpen}
          setOpen={closeCaseDialog}
        />
      )}

      {selectedTaskId && (
        <TaskDetailDialog
          taskId={selectedTaskId}
          open={isTaskDialogOpen}
          setOpen={closeTaskDialog}
        />
      )}
    </>
  )
}
