// components/dashboard/DashboardStats.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Briefcase, CalendarDays } from "lucide-react"
import { Link } from "react-router-dom"

interface Stat {
  title: string
  count: number
  delta: string
  icon: React.ElementType
  path: string
}

export function DashboardStats({ clientsCount, activeCasesCount, upcomingTasksCount }: {
  clientsCount: number
  activeCasesCount: number
  upcomingTasksCount: number
}) {
  const stats: Stat[] = [
    {
      title: "Total Clients",
      count: clientsCount,
      delta: "Tracking",
      icon: Users,
      path: "/clients",
    },
    {
      title: "Active Cases",
      count: activeCasesCount,
      delta: "In progress",
      icon: Briefcase,
      path: "/cases",
    },
    {
      title: "Upcoming Tasks",
      count: upcomingTasksCount,
      delta: "Pending",
      icon: CalendarDays,
      path: "/task",
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 bg-red-500">
      {stats.map((stat, i) => (
        <Link to={stat.path} key={i} className="hover:no-underline">
          <Card className="hover:shadow-md hover:ring-1 hover:ring-primary transition cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-1">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">{stat.count}</p>
              <p className="text-xs text-muted-foreground">{stat.delta}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
