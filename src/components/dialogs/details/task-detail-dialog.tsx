import { useTaskStore } from "@/stores/task-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Props = {
  taskId: string;
  open: boolean;
  setOpen: (val: boolean) => void;
};

export const TaskDetailDialog = ({ taskId, open, setOpen }: Props) => {
  const taskData = useTaskStore().tasks.find(t => t.id === taskId);

  if (!taskData) {
    setOpen(false);
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{taskData.title}</DialogTitle>
        </DialogHeader>
        {/* Display other editable fields here */}
      </DialogContent>
    </Dialog>
  );
};
