import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EditableField } from "./editable-field";
import { Client } from "@/types";
import { CaseSection } from "./case-section";
import { useClientStore } from "@/stores/client-store"

type Props = {
  clientId: string;
  open: boolean;
  setOpen: (val: boolean) => void;
};


const handleOnSave = (id: string, field: keyof Client, value: string) => {
  useClientStore.getState().updateClient(id, field, value)
}


export const ClientDetailDialog = ({ clientId, open, setOpen }: Props) => {
  const clientData = useClientStore.getState().clients.find(c => c.id === clientId)
  if (!clientData) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="!max-w-screen-lg !w-full p-6">
        <DialogHeader>
          <DialogTitle>Client Details</DialogTitle>
        </DialogHeader>

        {/* Grid layout for details */}
        <div className="grid grid-cols-[70px_1fr] gap-y-3 gap-x-4 mt-4">
          <div className="font-medium pt-2">Name:</div>
          <EditableField value={clientData.name} onSave={(val) => handleOnSave(clientData.id, "name", val)} />

          <div className="font-medium pt-2">Email:</div>
          <EditableField value={clientData.email} onSave={(val) => handleOnSave(clientData.id, "email", val)} />

          <div className="font-medium pt-2">Phone:</div>
          <EditableField value={clientData.phone} onSave={(val) => handleOnSave(clientData.id, "phone", val)} />

          <div className="font-medium pt-2">Address:</div>
          <EditableField value={clientData.address || "Not Available"} onSave={(val) => handleOnSave(clientData.id, "address", val)} />

          <div className="font-medium pt-2">Notes:</div>
          <EditableField value={clientData.notes || "Not Available"} onSave={(val) => handleOnSave(clientData.id, "notes", val)} />
        </div>


        {/* CASES Section */}
        <CaseSection id={clientData.id} />
      </DialogContent>
    </Dialog>
  );
};
