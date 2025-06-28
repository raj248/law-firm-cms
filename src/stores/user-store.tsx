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
  currentUser: AllowedUser | null
  allowedUsers: AllowedUser[]
  loading: boolean
  error: string | null

  fetchCurrentUser: () => Promise<void>
  fetchAllowedUsers: () => Promise<void>

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
        if (error || !data.user) {
          set({ error: error?.message ?? "User not found", loading: false, currentUser: null })
          return
        }

        // Fetch from allowed_users table using user_id
        const { data: allowed, error: allowedError } = await supabase
          .from("allowed_users")
          .select("*")
          .eq("user_id", data.user.id)
          .single()

        if (allowedError || !allowed) {
          set({
            error: allowedError?.message ?? "Allowed user not found",
            loading: false,
            currentUser: null
          })
          return
        }

        const parsed = AllowedUserSchema.safeParse(allowed)
        if (!parsed.success) {
          window.debug.log("Invalid allowed user data format", parsed.error)
          set({ error: "Invalid allowed user data format", loading: false, currentUser: null })
          return
        }

        set({ currentUser: parsed.data, loading: false })
        // window.debug.log("Fetched Current User: ", parsed.data)
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
        // window.debug.log("Allowed Users: ", parsed.data)
      },

      getUserById: (id) => {
        const { allowedUsers } = get()
        return allowedUsers.find((user) => user.id === id)
      },

      isCurrentUserAdmin: () => {
        const { currentUser } = get()
        return currentUser?.role === "admin"
      }
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

// Supabase Auth Listener for auto-sync
supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
  const { fetchCurrentUser } = useUserStore.getState()
  window.debug.log("Session User: ", session?.user.email)
  // window.debug.log("Event: ", event)
  if (["SIGNED_IN", "SIGNED_OUT", "TOKEN_REFRESHED"].includes(event)) {
    fetchCurrentUser()
  }
})
