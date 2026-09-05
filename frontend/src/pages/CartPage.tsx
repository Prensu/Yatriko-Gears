import { useEffect, useMemo, useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { useCart } from "@/context/CartContext"
import { useToast } from "@/context/ToastContext"
import { usePageMeta } from "@/hooks/usePageMeta"
import { fetchGear } from "@/api/gear"
import { createBooking, fetchAvailability } from "@/api/booking"
import { ApiRequestError } from "@/lib/api"
import { resolveGearImage } from "@/lib/gearImages"
import type { Availability, Gear } from "@/types"

/** Local YYYY-MM-DD — toISOString() would shift the date in Nepal's timezone. */
function toInputDate(date: Date): string {
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

const today = toInputDate(new Date())
const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || "9779747672039"

export default function CartPage() {
  usePageMeta({
    title: "Your Cart",
    description: "Review your gear and confirm your booking.",
    path: "/cart",
    noIndex: true,
  })

  const { items, removeItem, updateQuantity, clearCart } = useCart()
  const { user, status } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  /* ------------------------------------------------------------------ */
  /* Gear data — fetch full details for everything in the cart             */
  /* ------------------------------------------------------------------ */
  const [gearMap, setGearMap] = useState<Map<string, Gear>>(new Map())
  const [gearLoading, setGearLoading] = useState(true)

  useEffect(() => {
    if (items.length === 0) {
      setGearLoading(false)
      return
    }
    setGearLoading(true)
    fetchGear({ limit: 100 })
      .then((allGear) => {
        const map = new Map<string, Gear>()
        for (const gear of allGear) map.set(gear._id, gear)
        setGearMap(map)
      })
      .finally(() => setGearLoading(false))
  }, [items.length])

  /* ------------------------------------------------------------------ */
  /* Shared rental dates                                                   */
  /* ------------------------------------------------------------------ */
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)

  const days = useMemo(() => {
    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime()
    if (Number.isNaN(start) || Number.isNaN(end) || end < start) return 0
    return Math.round((end - start) / 86400000) + 1
  }, [startDate, endDate])

  /* ------------------------------------------------------------------ */
  /* Per-item availability checks                                         */
  /* ------------------------------------------------------------------ */
  const [availability, setAvailability] = useState<Map<string, Availability>>(new Map())
  const [checkingStock, setCheckingStock] = useState(false)

  useEffect(() => {
    if (items.length === 0 || !startDate || !endDate || endDate < startDate) return
    let cancelled = false
    setCheckingStock(true)

    Promise.all(
      items.map((item) =>
        fetchAvailability(item.gearId, startDate, endDate).then((result) => [item.gearId, result] as const),
      ),
    )
      .then((results) => {
        if (cancelled) return
        const map = new Map<string, Availability>()
        for (const [gearId, result] of results) map.set(gearId, result)
        setAvailability(map)
      })
      .catch(() => {
        if (!cancelled) setAvailability(new Map())
      })
      .finally(() => {
        if (!cancelled) setCheckingStock(false)
      })

    return () => {
      cancelled = true
    }
  }, [items, startDate, endDate])

  /* ------------------------------------------------------------------ */
  /* Delivery form state                                                   */
  /* ------------------------------------------------------------------ */
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address ?? "")
  const [phone, setPhone] = useState(user?.phone ?? "")
  const [note, setNote] = useState("")

  /* ------------------------------------------------------------------ */
  /* Price preview (server recomputes — this is display-only)              */
  /* ------------------------------------------------------------------ */
  const subtotal = useMemo(() => {
    let total = 0
    for (const item of items) {
      const gear = gearMap.get(item.gearId)
      if (gear) total += gear.discountedPrice * item.quantity * Math.max(days, 0)
    }
    return total
  }, [items, gearMap, days])

  /* ------------------------------------------------------------------ */
  /* Submission                                                            */
  /* ------------------------------------------------------------------ */
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const hasStockIssue = useMemo(() => {
    for (const item of items) {
      const avail = availability.get(item.gearId)
      if (avail && item.quantity > avail.quantityAvailable) return true
    }
    return false
  }, [items, availability])

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError("")

    if (status !== "authenticated") {
      navigate("/login")
      return
    }

    if (days < 1) {
      setError("Return date cannot be before the pickup date.")
      return
    }

    if (items.length === 0) {
      setError("Your cart is empty.")
      return
    }

    setSubmitting(true)

    try {
      const booking = await createBooking({
        items: items.map((item) => ({ gear: item.gearId, quantity: item.quantity })),
        startDate,
        endDate,
        deliveryAddress,
        phone,
        note,
      })

      clearCart()
      toast.success(`Booking ${booking.code} confirmed!`)
      navigate(`/bookings?new=${booking.code}`, { replace: true })
    } catch (submitError) {
      setError(
        submitError instanceof ApiRequestError
          ? submitError.message
          : "Could not create your booking. Try again.",
      )
      setSubmitting(false)
    }
  }

  /* ------------------------------------------------------------------ */
  /* Empty cart                                                            */
  /* ------------------------------------------------------------------ */
  if (!gearLoading && items.length === 0) {
    return (
      <section className="section-pad bg-sand">
        <div className="container-site max-w-3xl text-center">
          <p className="text-6xl">🛒</p>
          <h1 className="mt-4 font-display text-2xl font-extrabold text-navy-900">
            Your cart is empty
          </h1>
          <p className="mt-2 text-slate-500">
            Browse our gear catalogue and add what you need for your next adventure.
          </p>
          <Link to="/gear" className="btn-primary mt-6 inline-flex">
            Browse gear
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="section-pad bg-sand">
      <div className="container-site max-w-5xl">
        <Link to="/gear" className="text-sm font-semibold text-forest-700 hover:underline">
          ← Continue browsing
        </Link>

        <h1 className="mt-4 font-display text-3xl font-extrabold text-navy-900">Your Cart</h1>
        <p className="mt-1 text-slate-500">
          Review your gear, pick your dates, and confirm your booking.
        </p>

        <form onSubmit={onSubmit} noValidate className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* ---- Left column: cart items + forms ---- */}
          <div className="space-y-6 lg:col-span-2">
            {/* Cart items */}
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="font-display font-bold text-navy-900">
                Gear ({items.length} item{items.length !== 1 ? "s" : ""})
              </h2>

              {gearLoading ? (
                <div className="mt-4 space-y-4">
                  {Array.from({ length: items.length }).map((_, index) => (
                    <div key={index} className="h-20 animate-pulse rounded-2xl bg-slate-50" />
                  ))}
                </div>
              ) : (
                <ul className="mt-4 divide-y divide-slate-100">
                  {items.map((item) => {
                    const gear = gearMap.get(item.gearId)
                    if (!gear) return null
                    const imageSrc = resolveGearImage(gear.image)
                    const avail = availability.get(item.gearId)
                    const overStock = avail ? item.quantity > avail.quantityAvailable : false

                    return (
                      <li key={item.gearId} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                        {imageSrc ? (
                          <img src={imageSrc} alt="" className="h-20 w-20 flex-shrink-0 rounded-xl object-cover" />
                        ) : (
                          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-xl bg-sand text-3xl">
                            ⛺
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate font-display font-semibold text-navy-900">
                                {gear.name}
                              </p>
                              <p className="text-sm text-slate-500">
                                Rs. {gear.discountedPrice} / day
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(item.gearId)}
                              className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                              aria-label={`Remove ${gear.name}`}
                            >
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14" />
                              </svg>
                            </button>
                          </div>

                          {/* Quantity stepper */}
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.gearId, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-sm font-bold text-slate-600 transition hover:border-forest-400 hover:text-forest-700 disabled:opacity-30"
                            >
                              −
                            </button>
                            <span className="min-w-[1.5rem] text-center font-display font-bold text-navy-900">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.gearId, item.quantity + 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-sm font-bold text-slate-600 transition hover:border-forest-400 hover:text-forest-700"
                            >
                              +
                            </button>

                            {days > 0 && (
                              <span className="ml-auto text-sm font-semibold text-forest-700">
                                Rs. {(gear.discountedPrice * item.quantity * days).toLocaleString("en-IN")}
                              </span>
                            )}
                          </div>

                          {/* Stock warning */}
                          {checkingStock ? (
                            <p className="mt-1 text-xs text-slate-400">Checking availability…</p>
                          ) : avail ? (
                            avail.quantityAvailable === 0 ? (
                              <p className="mt-1 text-xs font-semibold text-red-600">
                                Fully booked for these dates — try different dates.
                              </p>
                            ) : overStock ? (
                              <p className="mt-1 text-xs font-semibold text-red-600">
                                Only {avail.quantityAvailable} available for these dates
                              </p>
                            ) : (
                              <p className="mt-1 text-xs text-slate-500">
                                <span className="font-semibold text-forest-700">
                                  {avail.quantityAvailable} available
                                </span>{" "}
                                for these dates
                              </p>
                            )
                          ) : null}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            {/* Rental dates */}
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="font-display font-bold text-navy-900">Rental dates</h2>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="startDate" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Pickup date
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    min={today}
                    className="input-underline"
                    value={startDate}
                    onChange={(event) => {
                      setStartDate(event.target.value)
                      if (endDate < event.target.value) setEndDate(event.target.value)
                    }}
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Return date
                  </label>
                  <input
                    id="endDate"
                    type="date"
                    min={startDate}
                    className="input-underline"
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Delivery details */}
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="font-display font-bold text-navy-900">Delivery details</h2>

              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Mobile number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="98XXXXXXXX"
                    className="input-underline"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="address" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Delivery address
                  </label>
                  <input
                    id="address"
                    type="text"
                    placeholder="Tole, city"
                    className="input-underline"
                    value={deliveryAddress}
                    onChange={(event) => setDeliveryAddress(event.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="note" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Note (optional)
                  </label>
                  <input
                    id="note"
                    type="text"
                    placeholder="Anything we should know?"
                    className="input-underline"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ---- Right column: order summary ---- */}
          <aside className="h-fit rounded-3xl border border-slate-100 bg-white p-6 shadow-sm lg:sticky lg:top-24">
            <h2 className="font-display font-bold text-navy-900">Order summary</h2>

            <dl className="mt-4 space-y-2 text-sm">
              {items.map((item) => {
                const gear = gearMap.get(item.gearId)
                if (!gear) return null
                return (
                  <div key={item.gearId} className="flex justify-between gap-2">
                    <dt className="truncate text-slate-500">
                      {gear.name} × {item.quantity}
                    </dt>
                    <dd className="whitespace-nowrap font-medium text-navy-900">
                      {days > 0
                        ? `Rs. ${(gear.discountedPrice * item.quantity * days).toLocaleString("en-IN")}`
                        : "—"}
                    </dd>
                  </div>
                )
              })}
            </dl>

            <dl className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Days</dt>
                <dd className="font-medium text-navy-900">{days > 0 ? days : "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Delivery</dt>
                <dd>
                  <a
                    href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hi Yatriko Gears! I want to discuss delivery for my booking.")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-forest-700 hover:underline"
                  >
                    Discuss on WhatsApp
                  </a>
                </dd>
              </div>
            </dl>

            <div className="mt-4 flex items-baseline justify-between border-t border-slate-100 pt-4">
              <span className="font-display font-bold text-navy-900">Total</span>
              <span className="font-display text-2xl font-extrabold text-forest-700">
                Rs. {subtotal.toLocaleString("en-IN")}
              </span>
            </div>

            {error ? (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {error}
              </p>
            ) : null}

            {status !== "authenticated" ? (
              <Link
                to="/login"
                className="btn-primary mt-5 flex w-full items-center justify-center gap-2"
              >
                Sign in to checkout
              </Link>
            ) : (
              <button
                type="submit"
                className="btn-primary mt-5 w-full"
                disabled={submitting || days < 1 || hasStockIssue || items.length === 0}
              >
                {submitting ? "Please wait…" : "Confirm Booking — Cash on Delivery"}
              </button>
            )}

            <p className="mt-3 text-center text-xs text-slate-400">
              Delivery charge will be discussed and confirmed on WhatsApp.
            </p>
          </aside>
        </form>
      </div>
    </section>
  )
}
