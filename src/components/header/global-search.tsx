"use client"

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { useEffect, useMemo, useRef, useState } from "react"
import { useClientStore } from "@/stores/client-store"
import { useCaseStore } from "@/stores/case-store"
import { useTaskStore } from "@/stores/task-store"
import Fuse, { FuseResultMatch } from "fuse.js"
import { Input } from "@/components/ui/input"
import { useDialogStore } from "@/stores/dialog-store"
import { Case, Client, Task } from "@/types"

// type Client = { id: string; name: string; email?: string; phone?: string }
// type Case = { id: string; title: string; description?: string; status: string }
// type Task = { id: string; title: string; description?: string }

type IndexedData =
  | ({ type: "Client"; matches?: FuseResultMatch[] } & Client)
  | ({ type: "Case"; matches?: FuseResultMatch[] } & Case)
  | ({ type: "Task"; matches?: FuseResultMatch[] } & Task)

export function GlobalSearch() {

  const handleClientClick = (id: string) => {
    useDialogStore.getState().openClientDialog(id)
  }
  const handleCaseClick = (id: string) => {
    useDialogStore.getState().openCaseDialog(id)
  }
  const handleTaskClick = (id: string) => {
    useDialogStore.getState().openTaskDialog(id)
  }

  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Record<"Client" | "Case" | "Task", IndexedData[]>>({
    Client: [],
    Case: [],
    Task: [],
  })

  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)


  const clients = useClientStore((s) => s.clients)
  const cases = useCaseStore((s) => s.cases)
  const tasks = useTaskStore((s) => s.tasks)
  // const router = useRouter()

  const fuse = useMemo(() => {
    const indexed: IndexedData[] = [
      ...clients.map((c) => ({ ...c, type: "Client" as const })),
      ...cases.map((c) => ({ ...c, type: "Case" as const })),
      ...tasks.map((t) => ({ ...t, type: "Task" as const })),
    ]


    return new Fuse(indexed, {
      keys: ["name", "email", "phone", "title", "description", "status"],
      threshold: 0.4,
      minMatchCharLength: 1,
      includeScore: true,
      includeMatches: true,
    })
  }, [clients, cases, tasks])

  const runSearch = (q: string) => {
    if (q.length > 0) {
      const matched = fuse.search(q).map((r) => ({
        ...r.item,
        matches: r.matches?.slice(), // convert readonly to mutable
      }))

      setResults({
        Client: matched.filter((r) => r.type === "Client"),
        Case: matched.filter((r) => r.type === "Case"),
        Task: matched.filter((r) => r.type === "Task"),
      })

    } else {
      setResults({
        Client: [],
        Case: [],
        Task: [],
      })
    }
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runSearch(query), 200)
  }, [query])

  // useEffect(() => {
  //   window.debug.log("Updated results:", results)
  // }, [results])


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K to focus
      if (e.key === "k" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        inputRef.current?.focus()
      }

      // Esc to blur and clear
      if (e.key === "Escape") {
        if (document.activeElement === inputRef.current) {
          inputRef.current?.blur()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])


  const renderItem = (item: IndexedData) => {
    const label =
      item.type === "Client" ? item.name :
        item.type === "Case" ? item.title :
          item.title

    const subInfo =
      item.type === "Client"
        ? `${item.email || "No email"} | ${item.phone || "No phone"}`
        : item.type === "Case"
          ? `Status: ${item.status}`
          : item.note ?? "No description"
    const key_id = (item: IndexedData) => {
      if (item.type !== 'Case') return item.id
      return item.file_id
    }
    return (
      <CommandItem
        key={key_id(item)}
        onMouseDown={() => {
          if (item.type === "Client") {
            handleClientClick(item.id)
          } else if (item.type === "Case") {
            handleCaseClick(item.file_id)
          } else if (item.type === "Task") {
            handleTaskClick(item.id)
          }
        }}
        className="group flex flex-col items-start cursor-pointer px-2 py-1.5 rounded-sm aria-selected:bg-muted/70"
      >
        {/* Inject a hidden id for uniqueness in the search system */}
        <span className="sr-only">{key_id(item)}</span>

        <span className="font-medium text-muted-foreground group-aria-selected:text-foreground">
          {label}
        </span>
        <span className="text-xs text-muted-foreground ">
          {subInfo}
        </span>
      </CommandItem>
    )
  }

  return (
    <div className="relative w-full mx-4">
      <Input
        placeholder="Press Ctrl+K to search..."
        className="w-full"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onBlur={() => setQuery("")}
        ref={inputRef}
      />

      {query && (
        <div className="absolute z-50 mt-2 w-full bg-white rounded-md shadow-lg border max-h-[400px] overflow-y-auto">
          <Command>
            <CommandList className="p-2 hide-scrollbar">
              <CommandEmpty>No results found.</CommandEmpty>

              {results.Client.length > 0 && (
                <CommandGroup heading="Clients">
                  {results.Client.map(renderItem)}
                </CommandGroup>
              )}

              {results.Case.length > 0 && (
                <CommandGroup heading="Cases">
                  {results.Case.map(renderItem)}
                </CommandGroup>
              )}

              {results.Task.length > 0 && (
                <CommandGroup heading="Tasks">
                  {results.Task.map(renderItem)}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  )
}
