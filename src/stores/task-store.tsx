import { create } from 'zustand'
import { Task } from '@/types'
import { toast } from 'sonner'

type TaskStore = {
  tasks: Task[]
  fetchTasks: () => Promise<void>
  addTask: (task: Task) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  getTasksByClient: (clientId: string) => Promise<Task[]>
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
  },

  deleteTask: async (id) => {
    await window.database.deleteTask(id)
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id)
    }))
  },

  getTasksByClient: async (clientId) => {
    const data = await window.database.getTasksByClient(clientId)
    return data
  },

  getTaskById: async (id) => {
    const data = get().tasks.find((t) => t.id === id)
    if (!data) toast.error('Task not found')
    return data
  }

}))
