import { useState, type FormEvent } from "react"
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { loginFormSchema } from "@/types/auth"
import { validateForm } from "@/types/forms"
import { ApiRequestError } from "@/lib/api"
import GoogleSignInButton from "@/components/auth/GoogleSignInButton"
import { usePageMeta } from "@/hooks/usePageMeta"

export default function LoginPage() {
  usePageMeta({
    title: "Sign in",
    description: "Sign in to book gear and track your rentals.",
    path: "/login",
    noIndex: true,
  })

  const { status, signIn, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const from = (location.state as { from?: string } | null)?.from ?? "/bookings"
  if (status === "authenticated") return <Navigate to={from} replace />

  const onGoogleCredential = async (credential: string) => {
    setFormError("")
    setSubmitting(true)
    try {
      await signInWithGoogle(credential)
      navigate(from, { replace: true })
    } catch (error) {
      setFormError(
        error instanceof ApiRequestError ? error.message : "Google sign-in failed. Try again.",
      )
      setSubmitting(false)
    }
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError("")

    const parsed = validateForm(loginFormSchema, { email, password })
    if (!parsed.ok) {
      setErrors(parsed.errors)
      return
    }
    setErrors({})
    setSubmitting(true)

    try {
      await signIn(parsed.data.email, parsed.data.password)
      navigate(from, { replace: true })
    } catch (error) {
      setFormError(
        error instanceof ApiRequestError ? error.message : "Could not sign you in. Try again.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="section-pad bg-sand">
      <div className="container-site max-w-md">
        <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
          <h1 className="font-display text-2xl font-extrabold text-navy-900">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to book gear and track your rentals.</p>

          <form onSubmit={onSubmit} noValidate className="mt-6 space-y-5">
            {formError ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {formError}
              </p>
            ) : null}

            <div>
              <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                className="input-underline"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email}</p> : null}
            </div>

            <div>
              <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className="input-underline"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              {errors.password ? <p className="mt-1 text-xs text-red-600">{errors.password}</p> : null}
            </div>

            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-6">
            <GoogleSignInButton onCredential={(c) => void onGoogleCredential(c)} disabled={submitting} />
          </div>

          <p className="mt-4 text-center text-sm">
            <Link to="/forgot-password" className="text-slate-500 hover:text-forest-700 hover:underline">
              Forgot your password?
            </Link>
          </p>

          <p className="mt-3 text-center text-sm text-slate-500">
            New here?{" "}
            <Link to="/register" className="font-semibold text-forest-700 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
