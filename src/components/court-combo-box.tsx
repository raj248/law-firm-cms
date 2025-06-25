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
import { CheckIcon, ChevronsUpDown, PlusCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

interface CourtComboboxProps {
  value: string
  onChange: (value: string, isNew?: boolean) => void
  options: string[]
}

export function CourtCombobox({ value, onChange, options }: CourtComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const filteredCourts = React.useMemo(() => {
    const q = search.toLowerCase()
    return options.filter(court => court.toLowerCase().includes(q))
  }, [search, options])

  const isExactMatch = options.some(
    court => court.toLowerCase() === search.toLowerCase()
  )

  return (
    <div>
      <Label className="mb-2 block">Court</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-full justify-between"
          >
            {value || "Select court"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput
              placeholder="Search court..."
              onValueChange={setSearch}
              className="h-9"
            />
            <CommandEmpty>No court found.</CommandEmpty>
            <CommandGroup>
              {filteredCourts.map((court) => (
                <CommandItem
                  key={court}
                  onSelect={() => {
                    onChange(court, false)
                    setOpen(false)
                  }}
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === court ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {court}
                </CommandItem>
              ))}
              {!isExactMatch && search.trim().length > 0 && (
                <CommandItem
                  onSelect={() => {
                    onChange(search.trim(), true)
                    setOpen(false)
                  }}
                >
                  <PlusCircle className="mr-2 h-4 w-4 text-primary" />
                  <span>Add “{search.trim()}”</span>
                </CommandItem>
              )}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
