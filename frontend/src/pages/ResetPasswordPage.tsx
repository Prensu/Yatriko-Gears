import { useState, type FormEvent } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { resetPassword } from "@/api/auth"
import { resetPasswordSchema } from "@/types/auth"
import { validateForm } from "@/types/forms"
import { ApiRequestError } from "@/lib/api"
import { usePageMeta } from "@/hooks/usePageMeta"

export default function ResetPasswordPage() {
  usePageMeta({
    title: "Set a new password",
    description: "Set a new password for your Yatriko Gears account.",
    noIndex: true,
  })

  const [params] = useSearchParams()
  const navigate = useNavigate()

  // The email can link straight here with ?token=… ; otherwise paste it.
  const [form, setForm] = useState({
    resetToken: params.get("token") ?? "",
    password: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const set = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }))

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const parsed = validateForm(resetPasswordSchema, form)
    if (!parsed.ok) {
      setErrors(parsed.errors)
      return
    }
    setErrors({})
    setSubmitting(true)
    try {
      await resetPassword(parsed.data)
      // Every session was revoked server-side, so sign in fresh.
      navigate("/login", { replace: true, state: { passwordReset: true } })
    } catch (error) {
      setFormError(
        error instanceof ApiRequestError ? error.message : "Could not reset your password",
      )
    } finally {
      setSubmitting(false)
    }
  }

  const field = (key: keyof typeof form, label: string, type = "text", placeholder?: string) => (
    <div>
      <label htmlFor={key} className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </label>
      <input
        id={key}
        type={type}
        placeholder={placeholder}
        autoComplete={type === "password" ? "new-password" : undefined}
        className="input-underline"
        value={form[key]}
        onChange={(event) => set(key, event.target.value)}
      />
      {errors[key] ? <p className="mt-1 text-xs text-red-600">{errors[key]}</p> : null}
    </div>
  )

  return (
    <section className="section-pad bg-sand">
      <div className="container-site max-w-md">
        <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
          <h1 className="font-display text-2xl font-extrabold text-navy-900">Set a new password</h1>
          <p className="mt-1 text-sm text-slate-500">
            Paste the token from your email, then choose a new password.
          </p>

          <form onSubmit={onSubmit} noValidate className="mt-6 space-y-5">
            {formError ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {formError}
              </p>
            ) : null}

            {field("resetToken", "Reset token", "text", "Paste from your email")}
            {field("password", "New password", "password")}
            {field("confirmPassword", "Confirm new password", "password")}

            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting ? "Saving…" : "Reset password"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            <Link to="/forgot-password" className="font-semibold text-forest-700 hover:underline">
              Request a new token
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
