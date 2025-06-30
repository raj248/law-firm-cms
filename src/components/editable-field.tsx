import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PencilIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  value: string
  onSave: (newValue: string) => void
  multiline?: boolean
  className?: string
}

export const EditableField = ({
  value,
  onSave,
  multiline = false,
  className = "",
}: Props) => {
  const [editing, setEditing] = useState(false)
  const [temp, setTemp] = useState(value)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
    }
  }, [editing])

  const handleSave = () => {
    if (temp !== value) {
      onSave(temp.trim())
    }
    setEditing(false)
  }

  const handleCancel = () => {
    setTemp(value)
    setEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!multiline) {
      if (e.key === "Enter") {
        e.preventDefault()
        handleSave()
      }
      if (e.key === "Escape") {
        e.preventDefault()
        handleCancel()
      }
    }
  }

  return editing ? (
    multiline ? (
      <Textarea
        ref={inputRef as any}
        value={temp}
        onChange={(e) => setTemp(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={cn("p-1 text-sm", className)}
      />
    ) : (
      <Input
        ref={inputRef as any}
        value={temp}
        onChange={(e) => setTemp(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={cn("p-1 text-sm", className)}
      />
    )
  ) : (
    <div
      className={cn(
        "flex items-center gap-1 group cursor-pointer w-fit",
        className
      )}
      onClick={() => setEditing(true)}
    >
      <p className="whitespace-pre-wrap break-words text-sm group-hover:underline">
        {value || <span className="italic text-muted-foreground">Click to edit</span>}
      </p>

      <PencilIcon className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  )
}
