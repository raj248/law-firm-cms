import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { EditableField } from "./editable-field"
import { Badge } from "@/components/ui/badge"
import { Case, courtOptions, statusOptions } from "@/types"
import { formatDistanceToNow } from "date-fns"
import { DropdownEditableField } from "./dropdown-editable-field"

type Props = {
  caseData: Case
  onUpdate: (field: keyof Case, value: string) => void
  open: boolean
  setOpen: (val: boolean) => void
}

export const CaseDetailDialog = ({ caseData, onUpdate, open, setOpen }: Props) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="!max-w-screen-md !w-full p-6">
        <DialogHeader>
          <DialogTitle><EditableField value={caseData.title} onSave={(val) => onUpdate("title", val)} /></DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-[110px_1fr] gap-y-3 gap-x-4 mt-4">
          <div className="font-medium pt-2">Description:</div>
          <EditableField
            value={caseData.description || "No Description"}
            onSave={(val) => onUpdate("description", val)}
            multiline
          />

          <div className="font-medium pt-2">Status:</div>
          {/* <EditableField value={caseData.status} onSave={(val) => onUpdate("status", val)} /> */}
          <DropdownEditableField
            value={caseData.status}
            options={statusOptions}
            onChange={(val) => onUpdate("status", val)}
          />

          <div className="font-medium pt-2">Court:</div>
          {/* <EditableField value={caseData.court} onSave={(val) => onUpdate("court", val)} /> */}
          <DropdownEditableField
            value={caseData.court}
            options={courtOptions}
            onChange={(val) => onUpdate("court", val)}
          />

          <div className="font-medium pt-2">Last Updated:</div>
          <div className="pt-2 text-muted-foreground">
            {caseData.updatedAt
              ? formatDistanceToNow(new Date(caseData.updatedAt), { addSuffix: true })
              : "Not Available"}
          </div>

          <div className="font-medium pt-2">Tags:</div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
              {caseData.court}
            </Badge>
            {caseData.tags?.length ? (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {caseData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            ) : (
              <div className="pt-1 text-muted-foreground italic">No Tags</div>
            )}

          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
