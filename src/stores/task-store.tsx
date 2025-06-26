import { create } from 'zustand'
import { Task } from '@/types'
import { toast } from 'sonner'

type TaskStore = {
  tasks: Task[]
  fetchTasks: () => Promise<void>
  addTask: (task: Task) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  getTasksByCaseId: (caseId: string) => Promise<Task[] | []>
  getTasksByClient: (client_id: string) => Promise<Task[] | []>
  getTaskById: (id: string) => Promise<Task | undefined>
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],

  fetchTasks: async () => {
    const tasks = await window.database.getAllTasks()
    set({ tasks })
  },

  addTask: async (task) => {
    await window.database.insertTask(task)
    set((state) => ({ tasks: [...state.tasks, task] }))
    toast.success('Task added successfully')
  },

  deleteTask: async (id) => {
    await window.database.deleteTask(id)
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id)
    }))
  },

  getTasksByClient: async (client_id) => {
    const data = get().tasks.filter((t) => t.client_id === client_id)
    // if (!data) toast.error('Tasks not found')
    return data
  },

  getTasksByCaseId: async (caseId) => {
    const data = get().tasks.filter((t) => t.caseId === caseId)
    // if (!data) toast.error('Tasks not found')
    return data
  },

  getTaskById: async (id) => {
    const data = get().tasks.find((t) => t.id === id)
    // if (!data) toast.error('Task not found')
    return data
  }

}))
