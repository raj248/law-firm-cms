// appointments/page.tsx
"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"

interface Appointment {
  id: string
  title: string
  date: Date
  note: string
}

export default function CalenderPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({ title: "", note: "" })

  const handleAddAppointment = () => {
    if (!selectedDate || !formData.title) return
    const newAppointment: Appointment = {
      id: crypto.randomUUID(),
      title: formData.title,
      date: selectedDate,
      note: formData.note,
    }
    setAppointments([...appointments, newAppointment])
    setFormData({ title: "", note: "" })
    setDialogOpen(false)
  }

  const filteredAppointments = appointments.filter(
    (appt) => format(appt.date, "yyyy-MM-dd") === format(selectedDate!, "yyyy-MM-dd")
  )

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Appointments</h1>
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={setSelectedDate}
        className="rounded-md border w-fit"
      />

      <div>
        <h2 className="text-xl font-semibold mb-2">Appointments on {selectedDate && format(selectedDate, "PPP")}</h2>
        {filteredAppointments.length ? (
          <ul className="space-y-2">
            {filteredAppointments.map((appt) => (
              <li key={appt.id} className="border rounded p-2">
                <p className="font-semibold">{appt.title}</p>
                <p className="text-sm text-muted-foreground">{appt.note}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">No appointments for this date.</p>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button>Add Appointment</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Appointment</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleAddAppointment()
            }}
            className="space-y-4"
          >
            <Input
              placeholder="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
            <Textarea
              placeholder="Notes (optional)"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            />
            <Button type="submit" className="w-full">Save</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
