"use client"

import { useEffect, useRef, useState } from "react"
import { format, formatDistanceToNow } from "date-fns"
import { X } from "lucide-react"
import { Audit } from "@/types"
import { playSound } from "@/utils/sound"

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

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const remainingRef = useRef<number>(6000)
  const startRef = useRef<number>(0)
  const lastAuditIdRef = useRef<string | null>(null)

  const sortedAudits = [...audits]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(-20)

  const latestAudit = sortedAudits[sortedAudits.length - 1]

  const startTimer = () => {
    startRef.current = Date.now()
    timerRef.current = setTimeout(() => {
      setVisible(false)
      onDismiss?.()
    }, remainingRef.current)
  }

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      remainingRef.current -= Date.now() - startRef.current
      timerRef.current = null
    }
  }

  useEffect(() => {
    if (newActivityTrigger && latestAudit) {
      // Play sound only if this audit has not been seen
      if (lastAuditIdRef.current !== latestAudit.id) {
        playSound('notification')
        lastAuditIdRef.current = latestAudit.id
      }

      setVisible(true)
      remainingRef.current = 6000
      startTimer()
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [newActivityTrigger, latestAudit])

  useEffect(() => {
    if (isHovering) {
      clearTimer()
    } else if (visible && !timerRef.current) {
      startTimer()
    }
  }, [isHovering])

  useEffect(() => {
    if (expanded && scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        // behavior: "smooth"
      });
    }
  }, [expanded, sortedAudits.length]);



  if (!visible || !latestAudit) return null

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
        expanded ? "w-[400px] sm:w-[450px] max-h-[400px]" : "w-[350px] max-h-[90px]"
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
                    <span>{formatDistanceToNow(new Date(audit.created_at), { addSuffix: true })}</span>
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
