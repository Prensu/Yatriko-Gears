import { useState, type FormEvent } from "react"
import { contactFormSchema, validateForm, type ContactFormValues } from "@/types/forms"
import { submitContact } from "@/api/forms"
import { CONTACTS } from "@/lib/fallbackData"

const EMPTY: ContactFormValues = { name: "", email: "", phone: "", subject: "", message: "" }

/** Trekking Planner-style indigo contact card with underline inputs. */
export default function ContactSection() {
  const [values, setValues] = useState<ContactFormValues>(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle")

  function set<K extends keyof ContactFormValues>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const result = validateForm(contactFormSchema, values)
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    setErrors({})
    setStatus("sending")
    try {
      await submitContact(result.data)
      setStatus("done")
      setValues(EMPTY)
    } catch {
      setStatus("error")
    }
  }

  const field = (key: keyof ContactFormValues, placeholder: string, type = "text") => (
    <div>
      <input
        type={type}
        value={values[key]}
        onChange={(e) => set(key, e.target.value)}
        placeholder={placeholder}
        className="input-underline"
        aria-label={placeholder}
      />
      {errors[key] && <p className="mt-1 text-xs text-red-600">{errors[key]}</p>}
    </div>
  )

  return (
    <section className="section-pad" id="contact">
      <div className="container-site grid gap-10 lg:grid-cols-5">
        {/* Indigo info card */}
        <div className="rounded-3xl bg-navy-900 p-8 text-white lg:col-span-2">
          <h2 className="font-display text-2xl font-extrabold">Let's Plan Your Camp 🏕️</h2>
          <p className="mt-3 text-sm text-slate-300">
            Questions, bookings, event planning — we reply fast on every channel.
          </p>
          <ul className="mt-8 space-y-5 text-sm">
            <li className="flex gap-3"><span>📍</span> {CONTACTS.address}</li>
            {CONTACTS.phones.map((p) => (
              <li key={p} className="flex gap-3">
                <span>📞</span>
                <a href={`tel:${p.replace(/\s/g, "")}`} className="hover:underline">{p}</a>
              </li>
            ))}
            <li className="flex gap-3">
              <span>✉️</span>
              <a href={`mailto:${CONTACTS.email}`} className="hover:underline">{CONTACTS.email}</a>
            </li>
          </ul>
        </div>

        {/* Underline form */}
        <form onSubmit={onSubmit} noValidate className="lg:col-span-3">
          <h2 className="font-display text-2xl font-extrabold text-navy-900">Send Us a Message</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {field("name", "Full Name *")}
            {field("email", "Email *", "email")}
            {field("phone", "Phone (98XXXXXXXX) *", "tel")}
            {field("subject", "Subject *")}
          </div>
          <div className="mt-6">
            <textarea
              value={values.message}
              onChange={(e) => set("message", e.target.value)}
              placeholder="Your Message *"
              rows={4}
              className="input-underline resize-none"
              aria-label="Your message"
            />
            {errors.message && <p className="mt-1 text-xs text-red-600">{errors.message}</p>}
          </div>
          <button type="submit" disabled={status === "sending"} className="btn-primary mt-8 disabled:opacity-60">
            {status === "sending" ? "Sending…" : "Send Message →"}
          </button>
          {status === "done" && (
            <p className="mt-4 text-sm font-semibold text-forest-600">
              ✓ Message sent! We'll get back to you shortly.
            </p>
          )}
          {status === "error" && (
            <p className="mt-4 text-sm text-red-600">
              Couldn't reach the server — please DM us on Instagram or call instead.
            </p>
          )}
        </form>
      </div>
    </section>
  )
}
