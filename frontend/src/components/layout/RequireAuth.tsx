import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"

/** Booking screens need a customer session; send guests to /login and back. */
export default function RequireAuth() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-forest-100 border-t-forest-600" />
      </div>
    )
  }

  if (status === "guest") {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }

  return <Outlet />
}
