import { create } from 'zustand'
import { Task } from '@/types'
import { toast } from 'sonner'
import { playSound } from '@/utils/sound'

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
      playSound('error')
      console.error(error)
    }
  },

  addTask: async (task) => {
    try {
      await window.database?.insertTask(task)
      set((state) => ({ tasks: [...state.tasks, task] }))
      toast.success('Task added successfully')
      playSound('info')
    } catch (error) {
      toast.error('Failed to add task')
      playSound('error')
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
      playSound('info')
    } catch (error) {
      toast.error('Failed to delete task')
      playSound('error')
      console.error(error)
    }
  },

  updateTask: async (id, field, value) => {
    try {
      const currentTask = get().tasks.find((t) => t.id === id)
      if (!currentTask) {
        toast.error("Task not found")
        playSound('error')
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
        playSound('info')
      } else {
        toast.error(result?.error || "Failed to update task")
        playSound('error')
      }
    } catch (error) {
      toast.error("Failed to update task")
      playSound('error')
      console.error(error)
    }
  },


  markTaskCompleted: async (id) => {
    const currentTask = get().tasks.find((t) => t.id === id)
    if (!currentTask) {
      toast.error("Task not found")
      playSound('error')
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
      playSound('info')
      return
    }
    toast.error("Failed to mark task as completed", { description: result.error })
    playSound('error')
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
