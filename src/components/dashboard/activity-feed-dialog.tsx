"use client"

import { useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Audit } from "@/types";
import { playSound } from "@/utils/sound";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface Props {
  audits: Audit[];
  newActivityTrigger: boolean;
  onDismiss?: () => void;
}

export function ActivityFeedDialog({ audits, newActivityTrigger, onDismiss }: Props) {
  const [triggerVisible, setTriggerVisible] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const lastAuditIdRef = useRef<string | null>(null);

  const sortedAudits = [...audits]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(-20);

  const latestAudit = sortedAudits[sortedAudits.length - 1];

  useEffect(() => {
    if (newActivityTrigger && latestAudit) {
      if (lastAuditIdRef.current !== latestAudit.id) {
        playSound("notification");
        lastAuditIdRef.current = latestAudit.id;
      }
      setTriggerVisible(true);

      const timer = setTimeout(() => {
        setTriggerVisible(false);
        onDismiss?.();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [newActivityTrigger, latestAudit, onDismiss]);

  const getActionVerb = (actionType: string) => {
    const type = actionType.toUpperCase();
    if (type === "INSERT") return "Added";
    if (type === "UPDATE") return "Updated";
    if (type === "DELETE") return "Deleted";
    return type;
  };

  return (
    <>
      <AnimatePresence>
        {triggerVisible && latestAudit && (
          <motion.div
            initial={{ x: "100%", opacity: 0 }}  // start off-screen right
            animate={{ x: "0%", opacity: 1 }}    // slide into place
            exit={{ x: "100%", opacity: 0 }}     // slide out to right
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-4 top-1/2 -translate-y-1/2 z-50" // align right
          >

            <Button
              variant="secondary"
              onClick={() => {
                setDialogOpen(true);
                setTriggerVisible(false);
              }}
              className="
                w-full max-w-xs
                h-15
                p-4 text-left mr-2
                border-2 border-border
              "
            >

              <div className="text-ellipsis overflow-clip">
                <span className="block text-xs text-muted-foreground">
                  {getActionVerb(latestAudit.action_type)} {latestAudit.object_type} {latestAudit.object_name}
                </span>

                <span className="block text-[10px] text-muted-foreground">
                  {latestAudit.user_name || "Unknown User"} • {formatDistanceToNow(new Date(latestAudit.created_at), { addSuffix: true })}
                </span>
              </div>
            </Button>


          </motion.div>
        )}
      </AnimatePresence>


      <Sheet open={dialogOpen} onOpenChange={setDialogOpen}>
        <SheetContent
          side="right"
          className="
            w-[80vw] max-w-sm
            h-[95vh] max-h-sm
            m-4 rounded-xl shadow-xl
            sm:w-[250px] sm:max-w-md
            md:w-[300px] md:max-w-lg
            lg:w-[350px] lg:max-w-xl
          "
        >
          <SheetHeader>
            <SheetTitle>Activity Feed</SheetTitle>
          </SheetHeader>

          <ScrollArea className="max-h-[80vh] mt-4">
            <div className="flex flex-col gap-2 p-2">
              {sortedAudits.reverse().map((audit) => (
                <div
                  key={audit.id}
                  className="flex flex-col rounded bg-muted p-2 shadow-sm"
                >
                  <p className="text-sm">
                    {getActionVerb(audit.action_type)}{" "}
                    <span className="font-medium">{audit.object_type}</span>{" "}
                    <span className="font-semibold">{audit.object_name}</span>
                  </p>
                  <div className="flex justify-between text-[14px] text-muted-foreground mt-1">
                    <span>{audit.user_name || "Unknown User"}</span>
                    <span>{formatDistanceToNow(new Date(audit.created_at), { addSuffix: true })}</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

    </>
  );
}
