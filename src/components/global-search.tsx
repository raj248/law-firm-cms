"use client"

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { useEffect, useMemo, useRef, useState } from "react"
import { useClientStore } from "@/stores/client-store"
import { useCaseStore } from "@/stores/case-store"
import { useTaskStore } from "@/stores/task-store"
// import { useRouter } from "next/navigation"
import Fuse, { FuseResultMatch } from "fuse.js"
import { Input } from "./ui/input"

type Client = { id: string; name: string; email?: string; phone?: string }
type Case = { id: string; title: string; description?: string; status: string }
type Task = { id: string; title: string; description?: string }

type IndexedData =
  | ({ type: "Client"; matches?: FuseResultMatch[] } & Client)
  | ({ type: "Case"; matches?: FuseResultMatch[] } & Case)
  | ({ type: "Task"; matches?: FuseResultMatch[] } & Task)

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Record<"Client" | "Case" | "Task", IndexedData[]>>({
    Client: [],
    Case: [],
    Task: [],
  })

  const debounceRef = useRef<NodeJS.Timeout | null>(null)

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

    window.debug.log("fuse indexed:", cases)


    return new Fuse(indexed, {
      keys: ["name", "email", "phone", "title", "description", "status"],
      threshold: 0.4,
      minMatchCharLength: 2,
      includeScore: true,
      includeMatches: true,
    })
  }, [clients, cases, tasks])

  const runSearch = (q: string) => {
    window.debug.log("runSearch:", q)
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
    debounceRef.current = setTimeout(() => runSearch(query), 50)
  }, [query])

  useEffect(() => {
    window.debug.log("Updated results:", results)
  }, [results])


  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    window.addEventListener("keydown", down)
    return () => window.removeEventListener("keydown", down)
  }, [])

  const renderItem = (item: IndexedData) => {
    window.debug.log("renderItem:", item)
    const label =
      item.type === "Client" ? item.name :
        item.type === "Case" ? item.title :
          item.title

    const subInfo =
      item.type === "Client"
        ? `${item.email || "No email"} | ${item.phone || "No phone"}`
        : item.type === "Case"
          ? `Status: ${item.status}`
          : item.description ?? "No description"

    return (
      <CommandItem
        key={item.id}

        onSelect={() => {
          setOpen(false)
          // router.push(`/${item.type.toLowerCase()}/${item.id}`)
          window.debug.log("item, needs router push", item)
        }}
        className="flex flex-col items-start"
      >
        <span className="font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">{subInfo}</span>
      </CommandItem>
    )
  }

  return (
    <div className="relative w-full mx-4">
      <Input
        placeholder="Search clients, cases, tasks..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
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
