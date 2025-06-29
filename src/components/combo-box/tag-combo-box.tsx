"use client"

import * as React from "react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronsUpDown, PencilIcon, PlusCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { useSettingsStore } from "@/stores/settings-store"

interface TagsComboboxProps {
  tags: string[]
  setTags: (tags: string[]) => void
  iconPencil?: boolean
}

export function TagsCombobox({
  tags,
  setTags,
  iconPencil = false,
}: TagsComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const options = useSettingsStore(state => state.tags)

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase()
    return options.filter(opt => opt.toLowerCase().includes(q))
  }, [search, options])

  const isExactMatch = options.some(opt => opt.toLowerCase() === search.toLowerCase())

  const toggleTag = (tag: string) => {
    setTags(
      tags.includes(tag)
        ? tags.filter(t => t !== tag)
        : [...tags, tag]
    )
  }

  const addNewTag = () => {
    const newTag = search.trim()
    if (!newTag) return

    if (!options.includes(newTag)) {
      setTags([...tags, newTag])
      useSettingsStore.getState().addTag(newTag)
    } else {
      toggleTag(newTag)
    }

    setSearch("")
    setOpen(false)
  }

  return (
    <div>
      {!iconPencil && (<Label className="mb-2 block">Tags</Label>)}
      <Popover open={open} onOpenChange={() => { setOpen(!open); setSearch('') }}>
        <PopoverTrigger asChild>
          {!iconPencil ? (
            <Button
              variant="outline"
              className={cn("w-full justify-start", tags.length === 0 && "text-muted-foreground")}
            >
              {tags.length > 0 ? tags.join(", ") : "Select tags"}
              <ChevronsUpDown className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          ) : (
            <Button size="icon" variant="ghost">
              <PencilIcon className="w-4 h-4" />
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0">
          <Command>
            <CommandInput
              placeholder="Search tags..."
              onValueChange={setSearch}
              className="h-9"
            />
            <CommandEmpty>
              {search && !isExactMatch ? (
                <Button
                  variant="outline"
                  onClick={addNewTag}
                  className="w-full justify-start"
                >
                  <PlusCircle className="mr-2 h-4 w-4 text-primary" />
                  <span>Add “{search.trim()}”</span>
                </Button>
              ) : "No tags found."}
            </CommandEmpty>
            <CommandGroup>
              {filtered.map((tag) => (
                <CommandItem
                  key={tag}
                  onSelect={() => toggleTag(tag)}
                  className="cursor-pointer"
                >
                  <Checkbox
                    className="mr-2"
                    checked={tags.includes(tag)}
                    onCheckedChange={() => toggleTag(tag)}
                  />
                  {tag}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
