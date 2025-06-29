"use client"

import { useEffect, useRef, useState } from "react"
import { format } from "date-fns"
import { X } from "lucide-react"
import { Audit } from "@/types"
import { playNotificationSound } from "@/utils/sound"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface Props {
  audits: Audit[]
  newActivityTrigger: boolean
  onDismiss?: () => void
}

export function ActivityFeedPopover({
  audits,
  newActivityTrigger,
  onDismiss,
}: Props) {
  const [visible, setVisible] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Sort oldest first, keep last 20

  useEffect(() => {
    window.debug.log("ActivityFeedPopover rendered", Date.now())
  }, [])

  // window.debug.log("audits", audits)
  const sortedAudits = [...audits]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(-20)

  const latestAudit = sortedAudits[sortedAudits.length - 1]
  // window.debug.log("latestAudit", latestAudit)

  useEffect(() => {
    if (newActivityTrigger && latestAudit) {
      playNotificationSound()
      setVisible(true)

      const timer = setTimeout(() => {
        if (!isHovering) {
          setVisible(false)
          onDismiss?.()
        }
      }, 6000)

      return () => clearTimeout(timer)
    }
  }, [newActivityTrigger])

  useEffect(() => {
    if (expanded && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [expanded])

  if (!visible || !latestAudit) return null

  // Utility to convert action_type to readable verb
  const getActionVerb = (actionType: string) => {
    const type = actionType.toUpperCase()
    if (type === "INSERT") return "Added"
    if (type === "UPDATE") return "Updated"
    if (type === "DELETE") return "Deleted"
    return type
  }

  return (
    <div
      className={cn(
        "fixed right-4 top-1/2 -translate-y-1/2 z-50 bg-background border rounded-lg shadow-xl transition-all duration-300 overflow-hidden",
        expanded ? "w-[300px] sm:w-[350px] max-h-[400px]" : "w-[250px] max-h-[70px]"
      )}
      onMouseEnter={() => {
        setIsHovering(true)
        setExpanded(true)
      }}
      onMouseLeave={() => {
        setIsHovering(false)
        setExpanded(false)
      }}
    >
      <div className="relative">
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-1 right-1 z-10"
          onClick={() => {
            setVisible(false)
            onDismiss?.()
          }}
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </Button>

        {expanded ? (
          <ScrollArea ref={scrollRef} className="p-2 h-[350px]">
            <div className="flex flex-col gap-2">
              {sortedAudits.map((audit) => (
                <div
                  key={audit.id}
                  className="flex flex-col rounded bg-muted p-2 shadow-sm"
                >
                  <p className="text-sm">
                    {getActionVerb(audit.action_type)}{" "}
                    <span className="font-medium">{audit.object_type}</span>{" "}
                    <span className="font-semibold">{audit.object_name}</span>
                  </p>
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>{audit.user_name || "Unknown User"}</span>
                    <span>{format(new Date(audit.created_at), "PPP p")}</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col p-2">
            <p className="text-sm line-clamp-2">
              {getActionVerb(latestAudit.action_type)}{" "}
              <span className="font-medium">{latestAudit.object_type}</span>{" "}
              <span className="font-semibold">{latestAudit.object_name}</span>
            </p>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>{latestAudit.user_name || "Unknown User"}</span>
              <span>{format(new Date(latestAudit.created_at), "p")}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
