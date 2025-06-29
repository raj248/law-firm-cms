"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { format } from "date-fns"
import { X } from "lucide-react"
import { Audit } from "@/types"
import { playNotificationSound } from "@/utils/sound"

interface Props {
  audits: Audit[]
  newActivityTrigger: boolean
  onDismiss?: () => void
}

export function ActivityFeedPopover({ audits, newActivityTrigger, onDismiss }: Props) {
  const [visible, setVisible] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (newActivityTrigger) {
      playNotificationSound()
      setVisible(true)
      const timer = setTimeout(() => {
        setVisible(false)
        onDismiss?.()
      }, 6000)
      return () => clearTimeout(timer)
    }
  }, [newActivityTrigger])

  // Sort oldest first for natural upward scrolling
  const sortedAudits = [...audits]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(-20) // latest 20

  // Auto-scroll to bottom to show latest
  useEffect(() => {
    if (visible && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [visible, sortedAudits])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed top-4 right-4 z-50 w-[300px] sm:w-[350px] bg-background border rounded-lg shadow-xl p-3"
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-base font-semibold">New Activity</h3>
            <button onClick={() => setVisible(false)}>
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <div
            ref={scrollRef}
            className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1 hide-scrollbar"
          >
            {sortedAudits.length ? (
              sortedAudits.map((audit) => (
                <div
                  key={audit.id}
                  className="flex items-start gap-2 rounded bg-muted p-2 shadow-sm"
                >
                  <div className="flex-shrink-0 rounded-full bg-primary text-primary-foreground w-8 h-8 flex items-center justify-center text-xs font-bold">
                    {audit.user_name ? audit.user_name[0].toUpperCase() : "U"}
                  </div>
                  <div className="flex flex-col">
                    <p className="text-sm">
                      <span className="font-semibold">{audit.user_name || "Unknown User"}</span>{" "}
                      {audit.action_type}{" "}
                      <span className="font-medium">{audit.object_type}</span>
                    </p>
                    {audit.object_id && (
                      <p className="text-xs text-muted-foreground">ID: {audit.object_id}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground">
                      {format(new Date(audit.created_at), "PPP p")}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No activities yet.</p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
