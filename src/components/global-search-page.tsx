"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useClientStore } from "@/stores/client-store"
import { useCaseStore } from "@/stores/case-store"
import { useTaskStore } from "@/stores/task-store"
import { useDialogStore } from "@/stores/dialog-store"
import Fuse from "fuse.js"
import { Case, Client, Task } from "@/types"

type IndexedData =
  | ({ type: "Client" } & Client)
  | ({ type: "Case" } & Case)
  | ({ type: "Task" } & Task)

export function GlobalSearchPage() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<IndexedData[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const clients = useClientStore((s) => s.clients)
  const cases = useCaseStore((s) => s.cases)
  const tasks = useTaskStore((s) => s.tasks)

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
    })
  }, [clients, cases, tasks])

  useEffect(() => {
    if (query.trim() === "") {
      setResults([])
      return
    }
    const matched = fuse.search(query).map((r) => r.item)
    setResults(matched)
  }, [query, fuse])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        navigate(-1)
      }
    }

    const handleRightClick = (e: MouseEvent) => {
      e.preventDefault()
      navigate(-1)
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("contextmenu", handleRightClick)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("contextmenu", handleRightClick)
    }
  }, [navigate])


  const openDetail = (item: IndexedData) => {
    const ds = useDialogStore.getState()
    if (item.type === "Client") ds.openClientDialog(item.id)
    else if (item.type === "Case") ds.openCaseDialog(item.file_id)
    else if (item.type === "Task") ds.openTaskDialog(item.id)

    navigate(-1)
  }


  return (
    <div
      className="fixed inset-0 bg-background/40 backdrop-blur-sm z-50 flex justify-center items-start overflow-y-auto scrollbar-custom p-4"
      onClick={() => navigate(-1)}
    >
      <div
        className="max-w-2xl w-full"
        onClick={(e) => e.stopPropagation()} // prevent navigation on inner clicks
      >
        <Input
          ref={inputRef}
          placeholder="Search clients, cases, tasks..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          onClick={(e) => e.stopPropagation()} // prevent navigation
        />

        <div className="grid gap-4 mt-4 grid-cols-2 sm:grid-cols-3">
          {results.length === 0 && query !== "" && (
            <p className="text-muted-foreground text-sm italic">No results found.</p>
          )}

          {results.map((item) => (
            <Card
              key={item.type === "Case" ? item.file_id : item.id}
              className="cursor-pointer hover:ring-2 hover:ring-ring/20 transition"
              onClick={() => openDetail(item)}
            >
              <CardHeader>
                <CardTitle className="text-base">
                  {item.type === "Client" ? item.name : item.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                {item.type === "Client" && (
                  <>
                    <p>{item.email || "No email"}</p>
                    <p>{item.phone || "No phone"}</p>
                  </>
                )}
                {item.type === "Case" && (
                  <>
                    <p>{item.description || "No description"}</p>
                    <p>Status: {item.status}</p>
                  </>
                )}
                {item.type === "Task" && (
                  <>
                    <p>{item.note || "No description"}</p>
                    <p>Status: {item.status}</p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
