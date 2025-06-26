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
import { cn } from "@/lib/utils"
import { CheckIcon, ChevronsUpDown } from "lucide-react"
import { Case } from "@/types"

interface CaseComboboxProps {
  value: string
  onChange: (value: string) => void
  cases: Case[]
}

export function CaseCombobox({ value, onChange, cases }: CaseComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const filteredCases = React.useMemo(() => {
    const q = search.toLowerCase()
    return cases.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.court.toLowerCase().includes(q) ||
      c.status.toLowerCase().includes(q)
    )
  }, [search, cases])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between"
        >
          {value ? cases.find(c => c.file_id === value)?.title : "Select case"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput
            placeholder="Search by title, court, or status"
            onValueChange={setSearch}
            className="w-full"
          />
          <CommandEmpty>No case found.</CommandEmpty>
          <CommandGroup>
            {filteredCases.map((caseItem) => (
              <CommandItem
                key={caseItem.file_id}
                onSelect={() => {
                  onChange(caseItem.file_id)
                  setOpen(false)
                }}
              >
                <CheckIcon
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === caseItem.file_id ? "opacity-100" : "opacity-0"
                  )}
                />
                <div>
                  <div className="font-medium">{caseItem.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {caseItem.court} · {caseItem.status}
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
