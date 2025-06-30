import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EditableField } from "../../editable-field";
import { Client } from "@/types";
import { CaseSection } from "./case-section";
import { useClientStore } from "@/stores/client-store";

type Props = {
  client_id: string;
  open: boolean;
  setOpen: (val: boolean) => void;
};

const handleOnSave = (id: string, field: keyof Client, value: string) => {
  useClientStore.getState().updateClient(id, field, value);
};

export const ClientDetailDialog = ({
  client_id,
  open = true,
  setOpen = () => {
    open = false;
  },
}: Props) => {
  const clientData = useClientStore
    .getState()
    .clients.find((c) => c.id === client_id);
  if (!clientData) {
    setOpen(false);
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="!max-w-md w-full p-6">
        <DialogHeader className="items-center text-center">
          <DialogTitle className="text-lg font-semibold">
            <EditableField
              value={clientData.name}
              onSave={(val) => handleOnSave(clientData.id, "name", val)}
              className="text-lg font-semibold text-center"
            />
          </DialogTitle>
        </DialogHeader>

        {/* Centered Grid */}
        <div className="space-y-3 mt-4">
          {/* Email */}
          <div className="grid grid-cols-[100px_1fr] items-center gap-2 border-b pb-2">
            <span className="text-sm text-muted-foreground">Email:</span>
            <EditableField
              value={clientData.email}
              onSave={(val) => handleOnSave(clientData.id, "email", val)}
              className="text-sm"
            />
          </div>

          {/* Phone */}
          <div className="grid grid-cols-[100px_1fr] items-center gap-2 border-b pb-2">
            <span className="text-sm text-muted-foreground">Phone:</span>
            <EditableField
              value={clientData.phone}
              onSave={(val) => handleOnSave(clientData.id, "phone", val)}
              className="text-sm"
            />
          </div>

          {/* Address */}
          <div className="grid grid-cols-[100px_1fr] items-start gap-2 border-b pb-2">
            <span className="text-sm text-muted-foreground mt-1">Address:</span>
            <EditableField
              value={clientData.address || "Not Available"}
              onSave={(val) => handleOnSave(clientData.id, "address", val)}
              multiline
              className="text-sm"
            />
          </div>

          {/* Notes */}
          <div className="grid grid-cols-[100px_1fr] items-start gap-2 border-b pb-2">
            <span className="text-sm text-muted-foreground mt-1">Notes:</span>
            <EditableField
              value={clientData.note || "Not Available"}
              onSave={(val) => handleOnSave(clientData.id, "note", val)}
              multiline
              className="text-sm"
            />
          </div>
        </div>

        {/* CASES Section */}
        <CaseSection id={clientData.id} />
      </DialogContent>
    </Dialog>
  );
};
