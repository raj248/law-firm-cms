import { supabase } from "@/supabase/supabase"



export async function signUp(email: string, password: string, name: string) {
  // 1. Check if the email is in allowed_users
  const { data: allowedUser, error: lookupError } = await supabase
    .from("allowed_users")
    .select("id, user_id")
    .eq("email", email.toLowerCase())
    .single()

  if (lookupError || !allowedUser) {
    return {
      error: { message: "This email is not authorized for registration." },
      data: null,
    }
  }

  // 2. Block if already registered
  if (allowedUser.user_id) {
    return {
      error: { message: "This email is already registered." },
      data: null,
    }
  }

  // 3. Register the user
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  })
  
  if(error) return {data, error}
  
  // 4. If success, update allowed_users with user_id
  if (data?.user?.id) {
    await supabase
    .from("allowed_users")
    .update({ user_id: data.user.id })
    .eq("id", allowedUser.id)
  }
  return { data, error }

}



export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return error
}
