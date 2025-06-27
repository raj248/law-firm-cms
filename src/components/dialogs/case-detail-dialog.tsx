import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { EditableField } from "../editable-field"
import { Badge } from "@/components/ui/badge"
import { Case, statusOptions } from "@/types"
import { formatDistanceToNow } from "date-fns"
import { DropdownEditableField } from "../dropdown-editable-field"
import { useCaseStore } from "@/stores/case-store"
import React from "react"
import { TagsCombobox } from "../tag-combo-box"
import { useSettingsStore } from "@/stores/settings-store"

type Props = {
  file_id: string
  open: boolean
  setOpen: (val: boolean) => void
}

const handleOnSave = (id: string, field: keyof Case, value: any) => {
  useCaseStore.getState().updateCase(id, field, value)
}

export const CaseDetailDialog = ({ file_id, open, setOpen }: Props) => {
  const caseData = useCaseStore.getState().cases.find(c => c.file_id === file_id)
  if (!caseData) {
    setOpen(false)
    return null
  }

  const [tags, setTags] = React.useState<string[]>(caseData.tags ?? [])
  const courts = useSettingsStore.getState().courts
  React.useEffect(() => {
    setTags(caseData.tags ?? [])
  }, [caseData])

  const handleTagUpdate = async (newTags: string[]) => {
    setTags(newTags)
    await useCaseStore.getState().updateCase(caseData.file_id, "tags", newTags)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="!max-w-screen-md !w-full p-6">
        <DialogHeader>
          <DialogTitle><EditableField value={caseData.title} onSave={(val) => handleOnSave(caseData.file_id, "title", val)} /></DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-[110px_1fr] gap-y-3 gap-x-4 mt-4">
          <div className="font-medium pt-2">File ID:</div>
          <EditableField
            value={caseData.file_id}
            onSave={(val) => handleOnSave(caseData.file_id, "file_id", val)}
          />

          <div className="font-medium pt-2">Description:</div>
          <EditableField
            value={caseData.description || "No Description"}
            onSave={(val) => handleOnSave(caseData.file_id, "description", val)}
            multiline
          />

          <div className="font-medium pt-2">Status:</div>
          <DropdownEditableField
            value={caseData.status}
            options={statusOptions}
            onChange={(val) => handleOnSave(caseData.file_id, "status", val)}
          />

          <div className="font-medium pt-2">Court:</div>
          <DropdownEditableField
            value={caseData.court}
            options={courts}
            onChange={(val) => handleOnSave(caseData.file_id, "court", val)}
          />

          <div className="font-medium pt-2">Last Updated:</div>
          <div className="pt-2 text-muted-foreground">
            {caseData.updated_at
              ? formatDistanceToNow(new Date(caseData.updated_at), { addSuffix: true })
              : formatDistanceToNow(new Date(caseData.created_at), { addSuffix: true })}
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
                iconPencil
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
