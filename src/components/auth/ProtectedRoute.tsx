import { Navigate } from "react-router-dom"
import { useSession } from "@/hooks/useSession"

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { session, loading } = useSession()

  if (loading) return <div>Loading...</div>

  if (session) return children
  return <Navigate to="/login_register" />
}
