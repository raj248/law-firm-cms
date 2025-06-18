import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EditableField } from "./editable-field";
import { Client } from "@/types";
import { CaseSection } from "./case-section";

type Props = {
  clientData: Client;
  onUpdate: (field: keyof Client, value: string) => void;
  open: boolean;
  setOpen: (val: boolean) => void;
};

export const ClientDetailDialog = ({ clientData, onUpdate, open, setOpen }: Props) => {

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="!max-w-screen-lg !w-full p-6">
        <DialogHeader>
          <DialogTitle>Client Details</DialogTitle>
        </DialogHeader>

        {/* Grid layout for details */}
        <div className="grid grid-cols-[70px_1fr] gap-y-3 gap-x-4 mt-4">
          <div className="font-medium pt-2">Name:</div>
          <EditableField value={clientData.name} onSave={(val) => onUpdate("name", val)} />

          <div className="font-medium pt-2">Email:</div>
          <EditableField value={clientData.email} onSave={(val) => onUpdate("email", val)} />

          <div className="font-medium pt-2">Phone:</div>
          <EditableField value={clientData.phone} onSave={(val) => onUpdate("phone", val)} />

          <div className="font-medium pt-2">Address:</div>
          <EditableField value={clientData.address || "Not Available"} onSave={(val) => onUpdate("address", val)} />
        </div>


        {/* CASES Section */}
        <CaseSection id={clientData.id} />
      </DialogContent>
    </Dialog>
  );
};
