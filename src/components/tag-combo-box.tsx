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
import { ChevronsUpDown, PencilIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

interface TagsComboboxProps {
  tags: string[]
  setTags: (tags: string[]) => void
  options: string[]
  iconPencil?: boolean
}

export function TagsCombobox({ tags, setTags, options, iconPencil = false }: TagsComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase()
    return options.filter(opt => opt.toLowerCase().includes(q))
  }, [search, options])

  const toggleTag = (tag: string) => {
    setTags(
      tags.includes(tag)
        ? tags.filter(t => t !== tag)
        : [...tags, tag]
    )
  }

  return (
    <div>
      {!iconPencil && (<Label className="mb-2 block">Case Tags</Label>)}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {!iconPencil ? (<Button
            variant="outline"
            className={cn("w-full justify-start", tags.length === 0 && "text-muted-foreground")}
          >
            {tags.length > 0 ? tags.join(", ") : "Select tags"}
            <ChevronsUpDown className="ml-auto h-4 w-4 opacity-50" />
          </Button>) : (
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
            <CommandEmpty>No tags found.</CommandEmpty>
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
