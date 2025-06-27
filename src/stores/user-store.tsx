import { create } from "zustand"
import { supabase } from "@/supabase/supabase"
import { persist } from "zustand/middleware"
import { z } from "zod"
import { AuthChangeEvent, Session } from "@supabase/supabase-js"

const AllowedUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: z.string(), // replace with z.enum([...]) if using role enums
  user_id: z.string().nullable().transform((val) => val ?? ""),
  created_at: z.string()
})

type AllowedUser = z.infer<typeof AllowedUserSchema>

interface UserStoreState {
  currentUser: string | null // Supabase UID
  allowedUsers: AllowedUser[]
  loading: boolean
  error: string | null

  fetchCurrentUser: () => Promise<void>
  fetchAllowedUsers: () => Promise<void>

  // 🟩 computed + utils
  getUserById: (id: string) => AllowedUser | undefined
  isCurrentUserAdmin: () => boolean
}

export const useUserStore = create<UserStoreState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      allowedUsers: [],
      loading: false,
      error: null,

      async fetchCurrentUser() {
        set({ loading: true, error: null })
        const { data, error } = await supabase.auth.getUser()
        if (error) {
          set({ error: error.message, loading: false })
          return
        }
        set({ currentUser: data.user?.id ?? null, loading: false })
        window.debug.log("Current User: ", data.user.id)
      },

      async fetchAllowedUsers() {
        set({ loading: true, error: null })
        const { data, error } = await supabase.from("allowed_users").select("*")
        if (error) {
          set({ error: error.message, loading: false })
          return
        }
        const parsed = z.array(AllowedUserSchema).safeParse(data)
        if (!parsed.success) {
          window.debug.log("Invalid data format: ", parsed.error)
          set({ error: "Invalid data format", loading: false })
          return
        }
        set({ allowedUsers: parsed.data, loading: false })
        window.debug.log("Allowed Users: ", parsed.data)
      },

      // 🟩 computed + utilities
      getUserById: (id) => {
        const { allowedUsers } = get()
        return allowedUsers.find((user) => user.id === id)
      },

      isCurrentUserAdmin: () => {
        const { currentUser, allowedUsers } = get()
        const user = allowedUsers.find((u) => u.user_id === currentUser)
        return user?.role === "admin"
      },
    }),
    {
      name: "user-store",
      partialize: (state) => ({
        currentUser: state.currentUser,
        allowedUsers: state.allowedUsers
      })
    }
  )
)

// 🟩 Supabase Auth Listener for auto-sync

supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
  const { fetchCurrentUser } = useUserStore.getState()
  window.debug.log("Session User: ", session?.user)
  window.debug.log("Event: ", event)
  if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") {
    fetchCurrentUser()
  }
})
