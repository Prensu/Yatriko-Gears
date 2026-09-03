import { useEffect, useState, type FormEvent } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import { subscriberFormSchema, validateForm } from "@/types/forms"
import { subscribe } from "@/api/forms"
import { fetchSettings } from "@/api/settings"
import type { SiteSettings } from "@/types"
import offerImage from "@/assets/offer-15-off.jpg"

const STORAGE_KEY = "yatriko.leadModal.dismissedAt"

/**
 * Harvest Hosts-style two-panel lead-capture modal.
 * Left: promotional creative. Right: email capture → POST /api/v1/subscriber.
 *
 * Configuration (image, copy, timing, enabled state) is fetched from
 * GET /api/v1/settings; if the API is unreachable the bundled defaults
 * are used instead.
 */
export default function LeadCaptureModal() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle")
  const [settings, setSettings] = useState<SiteSettings | null>(null)

  // 1. Fetch settings, then decide whether/when to show.
  useEffect(() => {
    let cancelled = false

    fetchSettings().then((s) => {
      if (cancelled) return
      setSettings(s)

      // If the admin disabled the popup, skip everything.
      if (!s.leadModalEnabled) return

      const dismissedAt = Number(localStorage.getItem(STORAGE_KEY) ?? 0)
      const coolingDown = Date.now() - dismissedAt < s.leadModalCooldownDays * 86_400_000
      if (coolingDown) return

      const t = setTimeout(() => {
        if (!cancelled) setOpen(true)
      }, s.leadModalShowDelayMs)

      // Store cleanup for the timeout.
      cleanupRef = () => clearTimeout(t)
    })

    let cleanupRef: (() => void) | undefined
    return () => {
      cancelled = true
      cleanupRef?.()
    }
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, String(Date.now()))
    setOpen(false)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const result = validateForm(subscriberFormSchema, { email })
    if (!result.ok) {
      setError(result.errors.email ?? "Invalid email")
      return
    }
    setError(null)
    setStatus("sending")
    try {
      await subscribe(result.data)
    } catch {
      // Still mark done — don't block the user on backend availability.
    }
    setStatus("done")
    setTimeout(dismiss, 2200)
  }

  const root = document.getElementById("modal-root")
  if (!root) return null

  // Derive display values from settings, falling back to hardcoded originals.
  const displayImage = settings?.leadModalImage || offerImage
  const displayHeadline = settings?.leadModalHeadline || "Grand Opening Offer"
  const displayBody =
    settings?.leadModalBody ||
    "on every rental gear — 21 to 31 Shrawan. Drop your email and claim the deal."

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={dismiss}
          role="dialog"
          aria-modal="true"
          aria-label="Promotional offer"
        >
          <motion.div
            className="grid w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl md:grid-cols-2"
            initial={{ y: 40, scale: 0.96 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 40, scale: 0.96 }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={displayImage}
              alt="Yatriko Gears promotional offer"
              className="hidden h-full w-full object-cover md:block"
            />
            <div className="relative p-8">
              <button
                onClick={dismiss}
                aria-label="Close"
                className="absolute right-4 top-4 text-xl text-slate-400 hover:text-navy-900"
              >
                ✕
              </button>
              {status === "done" ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <p className="text-4xl">🎉</p>
                  <h3 className="mt-3 font-display text-xl font-bold">You're in!</h3>
                  <p className="mt-2 text-sm text-slate-500">We'll DM your details soon.</p>
                </div>
              ) : (
                <>
                  <p className="font-script text-2xl text-forest-600">{displayHeadline}</p>
                  <h3 className="mt-1 font-display text-3xl font-extrabold text-navy-900">
                    Get <span className="text-forest-600">15% OFF</span>
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">{displayBody}</p>
                  <form onSubmit={onSubmit} className="mt-6" noValidate>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      className="input-underline"
                      aria-label="Email address"
                    />
                    {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
                    <button type="submit" disabled={status === "sending"} className="btn-primary mt-6 w-full disabled:opacity-60">
                      {status === "sending" ? "Claiming…" : "Claim My 15% Off"}
                    </button>
                  </form>
                  <p className="mt-4 text-center text-[11px] text-slate-400">No spam — just trail-ready deals.</p>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    root,
  )
}
