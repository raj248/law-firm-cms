export async function deleteUser(userId: string) {
  console.log(process.env.VITE_SUPABASE_URL!)
  
  const res = await fetch(`${process.env.VITE_SUPABASE_URL!}/auth/v1/admin/users/${userId}`, {
    method: 'DELETE',
    headers: {
      apiKey: process.env.VITE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${process.env.VITE_SERVICE_ROLE_KEY!}`,
    },
  })

  if (res.status === 200 || res.status === 404) {
    return { success: true }
  }

  return { success: false, error: `Failed: ${await res.text()}` }
}
