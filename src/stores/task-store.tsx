import { create } from 'zustand'
import { Task } from '@/types'
import { toast } from 'sonner'

type TaskStore = {
  tasks: Task[]
  fetchTasks: () => Promise<void>
  addTask: (task: Task) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  updateTask: (id: string, field: keyof Task, value: any) => Promise<void>
  markTaskCompleted: (id: string) => Promise<void>
  getTasksByCaseId: (caseId: string) => Promise<Task[]>
  getTasksByClient: (client_id: string) => Promise<Task[]>
  getTaskById: (id: string) => Promise<Task | undefined>
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],

  fetchTasks: async () => {
    try {
      const tasks = await window.database?.getAllTasks() || []
      set({ tasks })
    } catch (error) {
      toast.error('Failed to fetch tasks')
      console.error(error)
    }
  },

  addTask: async (task) => {
    try {
      await window.database?.insertTask(task)
      set((state) => ({ tasks: [...state.tasks, task] }))
      toast.success('Task added successfully')
    } catch (error) {
      toast.error('Failed to add task')
      console.error(error)
    }
  },

  deleteTask: async (id) => {
    try {
      await window.database?.deleteTask(id)
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
      }))
      toast.success('Task deleted')
    } catch (error) {
      toast.error('Failed to delete task')
      console.error(error)
    }
  },

  updateTask: async (id, field, value) => {
    try {
      const currentTask = get().tasks.find((t) => t.id === id)
      if (!currentTask) {
        toast.error("Task not found")
        return
      }

      const updatedTask: Task = {
        ...currentTask,
        [field]: value,
        updated_at: new Date().toISOString(),
        is_synced: 0,
      }

      const result = window.database?.updateTask(updatedTask)
      if (result?.success) {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? updatedTask : t
          ),
        }))
        toast.success("Task updated")
      } else {
        toast.error(result?.error || "Failed to update task")
      }
    } catch (error) {
      toast.error("Failed to update task")
      console.error(error)
    }
  },


  markTaskCompleted: async (id) => {
    const currentTask = get().tasks.find((t) => t.id === id)
    if (!currentTask) {
      toast.error("Task not found")
      return
    }

    const updatedTask: Task = {
      ...currentTask,
      status: "Closed",
      updated_at: new Date().toISOString(),
      is_synced: 0,
    }
    window.debug.log(updatedTask)
    const result = await window.database.updateTask(updatedTask)
    window.debug.log(result)
    if (result.success) {
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === id ? updatedTask : t
        ),
      }))
      toast.success("Task marked as completed")
      return
    }
    toast.error("Failed to mark task as completed", { description: result.error })
  },


  getTasksByCaseId: async (caseId) => {
    const data = get().tasks.filter((t) => t.caseId === caseId)
    return data
  },

  getTasksByClient: async (client_id) => {
    const data = get().tasks.filter((t) => t.client_id === client_id)
    return data
  },

  getTaskById: async (id) => {
    const task = get().tasks.find((t) => t.id === id)
    return task
  },
}))
