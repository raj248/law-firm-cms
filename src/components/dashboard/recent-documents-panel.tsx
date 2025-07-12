// components/dashboard/RecentDocumentsPanel.tsx
"use client"

import { format } from "date-fns"
import { DocumentMetadata } from "@/types"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { FileText } from "lucide-react"

interface Props {
  documents: DocumentMetadata[]
  onView: (doc: DocumentMetadata) => void
}

export function RecentDocumentsPanel({ documents, onView }: Props) {
  const recentDocuments = documents
    .filter(doc => doc.lastAccessed && doc.lastAccessed.trim() !== "" && !isNaN(new Date(doc.lastAccessed).getTime()))
    .sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime())
    .slice(0, 8)

  return (
    <div>
      <h3 className="text-base font-semibold mb-2">Recent Documents</h3>
      <div className="flex gap-3 overflow-x-auto pb-1 hide-scrollbar ">
        {recentDocuments.length ? (
          recentDocuments.map(doc => (
            <button
              key={doc.id}
              onClick={() => onView(doc)}
              className="min-w-[180px] flex-shrink-0 rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary transition-transform hover:scale-[1.02] active:scale-95"
            >
              <Card className="w-full h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-1">
                  <CardTitle className="text-sm font-medium truncate">{doc.name}</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(doc.lastAccessed), "PPP")}
                  </p>
                </CardContent>
              </Card>
            </button>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No documents found.</p>
        )}
      </div>
    </div>
  )
}
