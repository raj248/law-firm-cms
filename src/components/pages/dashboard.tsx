import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Briefcase } from "lucide-react"

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div>
        <h2 className="text-2xl font-bold">Welcome Back!</h2>
        <p className="text-muted-foreground">Here’s an overview of your law firm.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">43</p>
            <p className="text-xs text-muted-foreground">+5 this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">12</p>
            <p className="text-xs text-muted-foreground">+2 this week</p>
          </CardContent>
        </Card>

        {/* Add more cards if needed */}
      </div>
    </div>
  )
}
