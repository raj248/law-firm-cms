import { CaseDetailDialog } from "@/components/dialogs/details/case-detail-dialog"
import { useDialogStore } from "@/stores/dialog-store"
import { ClientDetailDialog } from "./client-detail-dialog"
import { TaskDetailDialog } from "@/components/dialogs/details/task-detail-dialog"

export const DialogPortal = () => {
  const {
    selectedclient_id, isClientDialogOpen, closeClientDialog,
    selectedCaseId, isCaseDialogOpen, closeCaseDialog,
    selectedTaskId, isTaskDialogOpen, closeTaskDialog,
  } = useDialogStore()

  return (
    <>
      {selectedclient_id && (
        <ClientDetailDialog
          client_id={selectedclient_id}
          open={isClientDialogOpen}
          setOpen={closeClientDialog}
        />
      )}

      {selectedCaseId && (
        <CaseDetailDialog
          file_id={selectedCaseId}
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
