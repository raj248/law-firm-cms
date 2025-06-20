import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { EditableField } from "./editable-field"
import { Badge } from "@/components/ui/badge"
import { Case, courtOptions, statusOptions, tagOptions } from "@/types"
import { formatDistanceToNow } from "date-fns"
import { DropdownEditableField } from "./dropdown-editable-field"
import { useCaseStore } from "@/stores/case-store"
import React from "react"
import { TagsCombobox } from "./tag-combo-box"

type Props = {
  caseId: string
  open: boolean
  setOpen: (val: boolean) => void
}

const handleOnSave = (id: string, field: keyof Case, value: any) => {
  useCaseStore.getState().updateCase(id, field, value)
}

export const CaseDetailDialog = ({ caseId, open, setOpen }: Props) => {
  const caseData = useCaseStore.getState().cases.find(c => c.id === caseId)
  if (!caseData) return null

  const [tags, setTags] = React.useState<string[]>(caseData.tags ?? [])
  React.useEffect(() => {
    setTags(caseData.tags ?? [])
  }, [caseData])

  const handleTagUpdate = async (newTags: string[]) => {
    setTags(newTags)
    await useCaseStore.getState().updateCase(caseData.id, "tags", newTags)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="!max-w-screen-md !w-full p-6">
        <DialogHeader>
          <DialogTitle><EditableField value={caseData.title} onSave={(val) => handleOnSave(caseData.id, "title", val)} /></DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-[110px_1fr] gap-y-3 gap-x-4 mt-4">
          <div className="font-medium pt-2">Description:</div>
          <EditableField
            value={caseData.description || "No Description"}
            onSave={(val) => handleOnSave(caseData.id, "description", val)}
            multiline
          />

          <div className="font-medium pt-2">Status:</div>
          {/* <EditableField value={caseData.status} onSave={(val) => handleOnSave(caseData.id,"status", val)} /> */}
          <DropdownEditableField
            value={caseData.status}
            options={statusOptions}
            onChange={(val) => handleOnSave(caseData.id, "status", val)}
          />

          <div className="font-medium pt-2">Court:</div>
          {/* <EditableField value={caseData.court} onSave={(val) => handleOnSave(caseData.id,"court", val)} /> */}
          <DropdownEditableField
            value={caseData.court}
            options={courtOptions}
            onChange={(val) => handleOnSave(caseData.id, "court", val)}
          />

          <div className="font-medium pt-2">Last Updated:</div>
          <div className="pt-2 text-muted-foreground">
            {caseData.updatedAt
              ? formatDistanceToNow(new Date(caseData.updatedAt), { addSuffix: true })
              : "Not Available"}
          </div>

          <div className="font-medium pt-4">Tags:</div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
              {caseData.court}
            </Badge>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {tags.length > 0 ? (
                tags.map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))
              ) : (
                <div className="pt-1 text-muted-foreground italic">No Tags</div>
              )}
            </div>

            <div className="pt-2">
              <TagsCombobox
                tags={caseData.tags || []}
                setTags={handleTagUpdate}
                options={tagOptions.map(opt => opt)}
                iconPencil
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
