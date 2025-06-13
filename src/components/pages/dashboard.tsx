import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Briefcase, CalendarDays, FileText, ClipboardList } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AddClientDialog } from "@/components/add-client-dialog"
import { AddCaseDialog } from "@/components/add-case-dialog"



export default function Dashboard() {
  const clients = ["John Doe", "Jane Smith", "Client X"]
  const handleAddClient = (data: any) => {
    // ✅ Handle client data here:
    // - Save to local state
    // - Send to backend/API
    // - Show toast/notification
    console.log("New client:", data)
  }
  const handleAddCase = (data: any) => {
    console.log("New case:", data)
    // TODO: Save to DB, update state, or sync with backend
  }
  return (
    <div className="space-y-6 p-4">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold">Welcome Back!</h2>
        <p className="text-muted-foreground">Here’s an overview of your law firm.</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">43</p>
            <p className="text-xs text-muted-foreground">+5 this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">12</p>
            <p className="text-xs text-muted-foreground">+2 this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">4</p>
            <p className="text-xs text-muted-foreground">Today’s schedule</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <AddClientDialog onAdd={handleAddClient} />
        <Button variant="default">+ New Case</Button>
        <AddCaseDialog clients={clients} onAdd={handleAddCase} />
        <Button variant="outline">+ Schedule Appointment</Button>
      </div>

      {/* Recent Files */}
      <div className="space-y-2 ">
        <h3 className="text-lg font-semibold">Recent Documents</h3>
        <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
          {["Will_Draft_John.pdf", "Property_Dispute_Notes.docx", "Case_47_Evidence.pdf", "Case_47_Evidence.pdf", "Case_47_Evidence.pdf", "Case_47_Evidence.pdf", "Case_47_Evidence.pdf", "Case_47_Evidence.pdf", "Case_47_Evidence.pdf"].map((file, i) => (
            <Card key={i} className="min-w-[220px] flex-shrink-0">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium truncate">{file}</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Updated 2 days ago</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>


      {/* Task List */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Your Tasks</h3>
        <ul className="space-y-1 text-sm">
          <li className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
            Prepare affidavit for Case #47
          </li>
          <li className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
            Follow-up call with Client A
          </li>
        </ul>
      </div>
    </div>
  )
}
