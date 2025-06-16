import { create } from 'zustand'
import { Task } from '@/types'

type TaskStore = {
  tasks: Task[]
  fetchTasks: () => Promise<void>
  addTask: (task: Task) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  getTasksByClient: (clientId: string) => Promise<Task[]>
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
  }

}))
