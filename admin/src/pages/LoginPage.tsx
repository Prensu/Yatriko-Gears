import { useState, type FormEvent } from "react"
import { Navigate, useLocation, useNavigate } from "react-router-dom"
import { AccessDeniedError, useAuth } from "@/context/AuthContext"
import { useToast } from "@/context/ToastContext"
import { ApiRequestError, errorMessage } from "@/lib/api"
import { usePageMeta } from "@/hooks/usePageMeta"
import { loginFormSchema } from "@/types/auth"
import { validateForm } from "@/types/forms"
import FormField from "@/components/form/FormField"
import SubmitButton from "@/components/form/SubmitButton"

export default function LoginPage() {
  usePageMeta("Sign in")

  const { status, signIn } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Already signed in? Go where the guard originally wanted to send us.
  const from = (location.state as { from?: string } | null)?.from ?? "/"
  if (status === "authenticated") return <Navigate to={from} replace />

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)

    const parsed = validateForm(loginFormSchema, { email, password })
    if (!parsed.ok) {
      setErrors(parsed.errors)
      return
    }
    setErrors({})
    setSubmitting(true)

    try {
      const user = await signIn(parsed.data.email, parsed.data.password)
      toast.success(`Welcome back, ${user.name.split(" ")[0]}`)
      navigate(from, { replace: true })
    } catch (error) {
      if (error instanceof AccessDeniedError) {
        setFormError("Access denied — this account is not an administrator.")
        toast.error("Access denied")
      } else {
        const message = errorMessage(error, "Could not sign you in")
        setFormError(message)
        toast.error(message)
        if (error instanceof ApiRequestError) setErrors(error.fieldErrors)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-100 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 shadow-sm">
            <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 4 21 20H3L12 4Z" strokeLinejoin="round" />
            </svg>
          </span>
          <h1 className="text-lg font-semibold text-ink-950">Yatriko Gears Admin</h1>
          <p className="text-sm text-ink-500">Sign in with your administrator account.</p>
        </div>

        <form onSubmit={onSubmit} noValidate className="card space-y-4 p-5">
          {formError ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">
              {formError}
            </div>
          ) : null}

          <FormField label="Email" htmlFor="email" required error={errors.email}>
            <input
              id="email"
              type="email"
              autoComplete="username"
              autoFocus
              className={`input ${errors.email ? "input-error" : ""}`}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@yatrikogears.com"
            />
          </FormField>

          <FormField label="Password" htmlFor="password" required error={errors.password}>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className={`input ${errors.password ? "input-error" : ""}`}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
            />
          </FormField>

          <SubmitButton loading={submitting} className="btn-primary w-full">
            {submitting ? "Signing in…" : "Sign in"}
          </SubmitButton>
        </form>

        <p className="mt-4 text-center text-xs text-ink-500">
          Customer accounts cannot access this panel.
        </p>
      </div>
    </div>
  )
}
