import { toast } from "sonner"
import { supabase } from "../supabase"

async function auth() {
  const currentUserData = await supabase.auth.getUser()
  if(!currentUserData.data.user) return {permission: false, id: ''}

  const id = currentUserData.data.user.id
  const { data: user, error } = await supabase
  .from("allowed_users")
  .select("*")
  .eq("user_id", id)
  .single()

  if(error) return null
  return {permission: user.role==='admin', id: id}

}
export async function loadUsers() {
  const { data, error } = await supabase
    .from("allowed_users")
    .select("*")
    .order("created_at", { ascending: false })

  if (!error) return data
  else toast.error("Failed to load users", { description: error.message })
}

export async function addUser(name: string, email: string, role: string) {
  const permission = await auth()
  if(!permission) return
  if(!permission.permission) {
    toast.error("Unauthorised Action", {description:'Staff Cannot Add Users'})
    return
  }

  const {  error } = await supabase
    .from("allowed_users")
    .insert([{ name, email, role }])
    .select()
  if (!error) {
    toast.success(`User ${name} - ${email} - ${role} added successfully`)
    loadUsers()
  } else {
    toast.error("Error Adding User", { description: error.message })
  }
}

export async function updateRole(id: string, newRole: string) {
  const permission = await auth()
  if(!permission) return
  if(!permission.permission) {
    toast.error("Unauthorised Action", {description:'Staff Cannot Update Users'})
    return
  }

  const { error } = await supabase
    .from("allowed_users")
    .update({ role: newRole })
    .eq("id", id)
    .select()

  if (!error) {
    toast.success("Role updated")
    loadUsers()
  } else {
    toast.error("Error updating role", { description: error.message })
  }
}

export async function deleteUser(id: string) {
  const permission = await auth()
  if(!permission) return
  if(!permission.permission) {
    toast.error("Unauthorised Action", {description:'Staff Cannot Delete Users'})
    return
  }

  const { data: allUsers, error: error_admin } = await supabase
  .from("allowed_users")
  .select('id, role, user_id')
  // .eq("role", "admin")

  if (error_admin) {
    console.error("Error fetching admins:", error_admin.message)
    return
  }
  const user = allUsers.find((c)=> c.user_id === permission.id)
  const admins = allUsers.filter((c)=> c.role === 'admin')
  const userToBeDeleted = allUsers.find((c)=> c.id === id)

  const isOnlyAdmin = admins.length === 1 && user?.id === id

  if (isOnlyAdmin) {
    toast.error("Cannot remove your own admin role. At least one admin must exist.")
    return
  }

  
  const result = await window.admin.deleteUser(userToBeDeleted?.user_id)
  // window.debug.log(result)
  if(!result.success) {
    toast.error("Error Deleting User", { description: result.error })
    return
  }  
    const { error } = await supabase
    .from("allowed_users")
    .delete()
    .eq("id", id)

  if (!error) {
    toast.success("User Deleted")
    loadUsers()
  } else {
    toast.error("Error Deleting User", { description: error.message })
  }
}