import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ManageTagsCourtsDialog } from "@/components/dialogs/manage-tags-courts-dialog";

export const TagsCourtsButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Manage Tags & Courts</Button>
      <ManageTagsCourtsDialog open={open} setOpen={setOpen} />
    </>
  );
};
