import { create } from 'zustand'

export type Appointment = {
  id: string
  clientId: string
  caseId?: string
  date: string
  time: string
  notes?: string
}

type AppointmentState = {
  appointments: Appointment[]
  addAppointment: (data: Appointment) => void
  updateAppointment: (id: string, data: Partial<Appointment>) => void
  deleteAppointment: (id: string) => void
  setAppointments: (data: Appointment[]) => void
}

export const useAppointmentStore = create<AppointmentState>((set) => ({
  appointments: [],
  addAppointment: (data) =>
    set((state) => ({
      appointments: [...state.appointments, data],
    })),
  updateAppointment: (id, data) =>
    set((state) => ({
      appointments: state.appointments.map((a) =>
        a.id === id ? { ...a, ...data } : a
      ),
    })),
  deleteAppointment: (id) =>
    set((state) => ({
      appointments: state.appointments.filter((a) => a.id !== id),
    })),
  setAppointments: (data) => set({ appointments: data }),
}))
