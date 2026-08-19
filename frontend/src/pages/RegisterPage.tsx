import { useState, type FormEvent } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { register } from "@/api/auth"
import { registerFormSchema } from "@/types/auth"
import { validateForm } from "@/types/forms"
import { ApiRequestError } from "@/lib/api"
import GoogleSignInButton from "@/components/auth/GoogleSignInButton"

const EMPTY = { name: "", email: "", phone: "", address: "", password: "", confirmPassword: "" }

export default function RegisterPage() {
  const { status, signIn, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  if (status === "authenticated") return <Navigate to="/bookings" replace />

  const set = (key: keyof typeof EMPTY, value: string) =>
    setForm((current) => ({ ...current, [key]: value }))

  const onGoogleCredential = async (credential: string) => {
    setFormError("")
    setSubmitting(true)
    try {
      await signInWithGoogle(credential)
      navigate("/bookings", { replace: true })
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

    const parsed = validateForm(registerFormSchema, form)
    if (!parsed.ok) {
      setErrors(parsed.errors)
      return
    }
    setErrors({})
    setSubmitting(true)

    try {
      await register(parsed.data)
      // Registration doesn't return a session, so sign in straight away.
      await signIn(parsed.data.email, parsed.data.password)
      navigate("/bookings", { replace: true })
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setFormError(error.message)
        const detail = error.detail
        if (detail && typeof detail === "object" && !Array.isArray(detail)) {
          const fieldErrors: Record<string, string> = {}
          for (const [field, message] of Object.entries(detail as Record<string, unknown>)) {
            if (typeof message === "string") fieldErrors[field] = message
          }
          setErrors(fieldErrors)
        }
      } else {
        setFormError("Could not create your account. Try again.")
      }
    } finally {
      setSubmitting(false)
    }
  }

  const field = (
    key: keyof typeof EMPTY,
    label: string,
    type = "text",
    autoComplete?: string,
    placeholder?: string,
  ) => (
    <div>
      <label htmlFor={key} className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </label>
      <input
        id={key}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="input-underline"
        value={form[key]}
        onChange={(event) => set(key, event.target.value)}
      />
      {errors[key] ? <p className="mt-1 text-xs text-red-600">{errors[key]}</p> : null}
    </div>
  )

  return (
    <section className="section-pad bg-sand">
      <div className="container-site max-w-lg">
        <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
          <h1 className="font-display text-2xl font-extrabold text-navy-900">Create your account</h1>
          <p className="mt-1 text-sm text-slate-500">
            Book gear online and keep all your rentals in one place.
          </p>

          <form onSubmit={onSubmit} noValidate className="mt-6 space-y-5">
            {formError ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {formError}
              </p>
            ) : null}

            {field("name", "Full name", "text", "name")}
            {field("email", "Email", "email", "email")}
            {field("phone", "Mobile number", "tel", "tel", "98XXXXXXXX")}
            {field("address", "Address (optional)", "text", "street-address", "Khokana, Lalitpur")}

            <div className="grid gap-5 sm:grid-cols-2">
              {field("password", "Password", "password", "new-password")}
              {field("confirmPassword", "Confirm password", "password", "new-password")}
            </div>

            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting ? "Creating account…" : "Create account"}
            </button>
          </form>

          <div className="mt-6">
            <GoogleSignInButton onCredential={(c) => void onGoogleCredential(c)} disabled={submitting} />
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-forest-700 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
