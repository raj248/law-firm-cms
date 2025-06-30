import { useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Input } from "../ui/input"

export function GlobalSearch() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "f" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        navigate("/search")
        setTimeout(() => inputRef.current?.focus(), 0)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [navigate])

  return (
    <Input
      ref={inputRef}
      placeholder="Press Ctrl+F to search..."
      onFocus={() => navigate("/search")}
      className="mx-6 w-full"
    />
  )
}
