import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import Spinner from "@/components/common/Spinner"

/**
 * Route guard: every screen except /login sits behind this.
 * The session is re-validated against GET /auth/me on app load; a 401 that
 * survives one /auth/refresh-token retry lands the admin back on /login.
 */
export default function RequireAdmin() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-ink-50 text-ink-500">
        <Spinner className="h-6 w-6" />
        <p className="text-sm">Checking your session…</p>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }

  return <Outlet />
}
