import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { requestPasswordReset } from "@/api/auth"
import { forgotPasswordSchema } from "@/types/auth"
import { validateForm } from "@/types/forms"
import { ApiRequestError } from "@/lib/api"
import { usePageMeta } from "@/hooks/usePageMeta"

export default function ForgotPasswordPage() {
  usePageMeta({
    title: "Reset your password",
    description: "Request a password reset link for your Yatriko Gears account.",
    noIndex: true,
  })

  const [email, setEmail] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState("")

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const parsed = validateForm(forgotPasswordSchema, { email })
    if (!parsed.ok) {
      setErrors(parsed.errors)
      return
    }
    setErrors({})
    setSubmitting(true)
    try {
      await requestPasswordReset(parsed.data.email)
      setSent(true)
    } catch (error) {
      setFormError(error instanceof ApiRequestError ? error.message : "Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="section-pad bg-sand">
      <div className="container-site max-w-md">
        <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
          {sent ? (
            <>
              <p className="text-4xl">📧</p>
              <h1 className="mt-3 font-display text-2xl font-extrabold text-navy-900">Check your inbox</h1>
              <p className="mt-2 text-sm text-slate-500">
                If an account exists for <strong>{email}</strong>, we've sent a reset token. It is
                valid for 15 minutes.
              </p>
              <Link to="/reset-password" className="btn-primary mt-6 w-full">
                I have my token
              </Link>
            </>
          ) : (
            <>
              <h1 className="font-display text-2xl font-extrabold text-navy-900">Forgot your password?</h1>
              <p className="mt-1 text-sm text-slate-500">
                Enter your email and we'll send you a reset token.
              </p>

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

                <button type="submit" className="btn-primary w-full" disabled={submitting}>
                  {submitting ? "Sending…" : "Send reset token"}
                </button>
              </form>
            </>
          )}

          <p className="mt-6 text-center text-sm text-slate-500">
            <Link to="/login" className="font-semibold text-forest-700 hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
