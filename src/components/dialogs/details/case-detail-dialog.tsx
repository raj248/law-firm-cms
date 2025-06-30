import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { EditableField } from "../../editable-field"
import { Badge } from "@/components/ui/badge"
import { Case, statusOptions } from "@/types"
import { formatDistanceToNow } from "date-fns"
import { DropdownEditableField } from "../../dropdown-editable-field"
import { useCaseStore } from "@/stores/case-store"
import React from "react"
import { TagsCombobox } from "../../combo-box/tag-combo-box"
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
      <DialogContent className="!max-w-md w-full p-4">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            <EditableField
              value={caseData.title}
              onSave={(val) => handleOnSave(caseData.file_id, "title", val)}
              className="text-lg font-semibold"
            />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-3">
          {/* File ID */}
          <div className="grid grid-cols-[120px_1fr] items-start border-b pb-2 gap-2">
            <span className="text-sm text-muted-foreground mt-1">File ID:</span>
            <EditableField
              value={caseData.file_id}
              onSave={(val) => handleOnSave(caseData.file_id, "file_id", val)}
              className="text-sm"
            />
          </div>

          {/* Description */}
          <div className="grid grid-cols-[120px_1fr] items-start border-b pb-2 gap-2">
            <span className="text-sm text-muted-foreground mt-1">Description:</span>
            <EditableField
              value={caseData.description || "No Description"}
              onSave={(val) => handleOnSave(caseData.file_id, "description", val)}
              multiline
              className="text-sm text-wrap"
            />
          </div>

          {/* Status */}
          <div className="grid grid-cols-[120px_1fr] items-start border-b pb-2 gap-2">
            <span className="text-sm text-muted-foreground mt-1">Status:</span>
            <DropdownEditableField
              value={caseData.status}
              options={statusOptions}
              onChange={(val) => handleOnSave(caseData.file_id, "status", val)}
              className="w-full text-sm"
            />
          </div>

          {/* Court */}
          <div className="grid grid-cols-[120px_1fr] items-start border-b pb-2 gap-2">
            <span className="text-sm text-muted-foreground mt-1">Court:</span>
            <DropdownEditableField
              value={caseData.court}
              options={courts}
              onChange={(val) => handleOnSave(caseData.file_id, "court", val)}
              className="w-full text-sm"
            />
          </div>

          {/* Last Updated */}
          <div className="grid grid-cols-[120px_1fr] items-start border-b pb-2 gap-2">
            <span className="text-sm text-muted-foreground mt-1">Last Updated:</span>
            <span className="text-sm text-muted-foreground">
              {caseData.updated_at
                ? formatDistanceToNow(new Date(caseData.updated_at), { addSuffix: true })
                : formatDistanceToNow(new Date(caseData.created_at), { addSuffix: true })}
            </span>
          </div>

          {/* Tags */}
          <div className="grid grid-cols-[120px_1fr] items-start gap-2">
            <span className="text-sm text-muted-foreground mt-1">Tags:</span>
            <div className="space-y-1">
              <TagsCombobox tags={tags} setTags={handleTagUpdate} iconPencil />
              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                {tags.length > 0 ? (
                  tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground italic">No Tags</span>
                )}
              </div>
            </div>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  )
}
