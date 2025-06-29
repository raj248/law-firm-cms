// components/dashboard/RecentClientsCases.tsx
"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card"
import { Client, Case } from "@/types"
import { format } from "date-fns"


interface RecentClientsCasesProps {
  recentClients: Client[]
  recentCases: Case[]
}

export function RecentClientsCases({ recentClients, recentCases }: RecentClientsCasesProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Clients */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Recently Updated Clients</CardTitle>
        </CardHeader>
        <CardContent>
          {recentClients.length ? (
            <ul className="space-y-1 text-sm">
              {recentClients.map((client) => (
                <HoverCard key={client.id} openDelay={100} closeDelay={50}>
                  <HoverCardTrigger asChild>
                    <li className="flex justify-between cursor-pointer hover:text-primary">
                      <span>{client.name}</span>
                      <span className="text-muted-foreground text-xs">
                        {format(new Date(client.updated_at ?? client.created_at), "PPP")}
                      </span>
                    </li>
                  </HoverCardTrigger>
                  <HoverCardContent className="text-xs space-y-1">
                    <p><span className="font-medium">Name:</span> {client.name}</p>
                    <p><span className="font-medium">Phone:</span> {client.phone}</p>
                    {client.email && <p><span className="font-medium">Email:</span> {client.email}</p>}
                    {client.address && <p><span className="font-medium">Address:</span> {client.address}</p>}
                    {client.note && <p><span className="font-medium">Note:</span> {client.note}</p>}
                  </HoverCardContent>
                </HoverCard>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No clients found.</p>
          )}
        </CardContent>
      </Card>

      {/* Cases */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Recently Updated Cases</CardTitle>
        </CardHeader>
        <CardContent>
          {recentCases.length ? (
            <ul className="space-y-1 text-sm">
              {recentCases.map((c) => (
                <HoverCard key={c.file_id} openDelay={100} closeDelay={50}>
                  <HoverCardTrigger asChild>
                    <li className="flex justify-between cursor-pointer hover:text-primary">
                      <span>{c.title}</span>
                      <span className="text-muted-foreground text-xs">
                        {format(new Date(c.updated_at ?? c.created_at), "PPP")}
                      </span>
                    </li>
                  </HoverCardTrigger>
                  <HoverCardContent className="text-xs space-y-1">
                    <p><span className="font-medium">Title:</span> {c.title}</p>
                    <p><span className="font-medium">File ID:</span> {c.file_id}</p>
                    <p><span className="font-medium">Court:</span> {c.court}</p>
                    <p><span className="font-medium">Status:</span> {c.status}</p>
                    {(c.tags ?? []).length > 0 && (
                      <p><span className="font-medium">Tags:</span> {c.tags!.join(", ")}</p>
                    )}
                  </HoverCardContent>
                </HoverCard>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No cases found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
