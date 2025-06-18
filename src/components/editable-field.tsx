import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { PencilIcon } from "lucide-react"

type Props = {
  value: string
  onSave: (newValue: string) => void
  multiline?: boolean
}

export const EditableField = ({ value, onSave, multiline = false }: Props) => {
  const [editing, setEditing] = useState(false)
  const [temp, setTemp] = useState(value)

  return editing ? (
    <div className="flex flex-col gap-2 w-full">
      {multiline ? (
        <Textarea value={temp} onChange={(e) => setTemp(e.target.value)} />
      ) : (
        <Input value={temp} onChange={(e) => setTemp(e.target.value)} />
      )}
      <div className="flex gap-2">
        <Button size="sm" onClick={() => { onSave(temp); setEditing(false) }}>Save</Button>
        <Button size="sm" variant="outline" onClick={() => { setTemp(value); setEditing(false) }}>Cancel</Button>
      </div>
    </div>
  ) : (
    <div className="flex items-center gap-2 ">
      <p className="whitespace-pre-wrap">{value}</p>
      <Button size="icon" variant="ghost" onClick={() => setEditing(true)}>
        <PencilIcon className="w-4 h-4" />
      </Button>
    </div>
  )
}
