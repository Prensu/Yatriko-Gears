import { useEffect, useMemo, useState, type FormEvent } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { fetchGearBySlug } from "@/api/gear"
import { createBooking, initiateEsewa, redirectToEsewa } from "@/api/booking"
import { useAuth } from "@/context/AuthContext"
import { ApiRequestError } from "@/lib/api"
import { resolveGearImage } from "@/lib/gearImages"
import type { Gear } from "@/types"

/** Local YYYY-MM-DD — toISOString() would shift the date in Nepal's timezone. */
function toInputDate(date: Date): string {
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

const today = toInputDate(new Date())

export default function BookPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [gear, setGear] = useState<Gear | null>(null)
  const [loading, setLoading] = useState(true)

  const [quantity, setQuantity] = useState(1)
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address ?? "")
  const [phone, setPhone] = useState(user?.phone ?? "")
  const [note, setNote] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"esewa" | "cash">("esewa")

  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!slug) return
    fetchGearBySlug(slug)
      .then((found) => setGear(found ?? null))
      .finally(() => setLoading(false))
  }, [slug])

  // Preview only — the server recomputes this and its number is the one that counts.
  const days = useMemo(() => {
    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime()
    if (Number.isNaN(start) || Number.isNaN(end) || end < start) return 0
    return Math.round((end - start) / 86400000) + 1
  }, [startDate, endDate])

  const total = gear ? gear.discountedPrice * quantity * Math.max(days, 0) : 0

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!gear) return
    setError("")

    if (days < 1) {
      setError("Return date cannot be before the pickup date.")
      return
    }
    setSubmitting(true)

    try {
      const booking = await createBooking({
        items: [{ gear: gear._id, quantity }],
        startDate,
        endDate,
        deliveryAddress,
        phone,
        note,
        paymentMethod,
      })

      if (paymentMethod === "esewa") {
        const form = await initiateEsewa(booking._id)
        redirectToEsewa(form) // leaves the site for eSewa's checkout
        return
      }

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

  if (loading) {
    return (
      <section className="section-pad">
        <div className="container-site max-w-3xl animate-pulse space-y-4">
          <div className="h-8 w-1/3 rounded bg-slate-100" />
          <div className="h-64 rounded-3xl bg-slate-100" />
        </div>
      </section>
    )
  }

  if (!gear) {
    return (
      <section className="section-pad">
        <div className="container-site text-center">
          <p className="font-display text-xl font-bold text-navy-900">Gear not found</p>
          <Link to="/gear" className="btn-primary mt-6">
            Back to gear
          </Link>
        </div>
      </section>
    )
  }

  const imageSrc = resolveGearImage(gear.image)

  return (
    <section className="section-pad bg-sand">
      <div className="container-site max-w-5xl">
        <Link to="/gear" className="text-sm font-semibold text-forest-700 hover:underline">
          ← Back to gear
        </Link>

        <h1 className="mt-4 font-display text-3xl font-extrabold text-navy-900">Book {gear.name}</h1>
        <p className="mt-1 text-slate-500">
          Reserve online, we deliver across Kathmandu, Lalitpur and Bhaktapur.
        </p>

        <form onSubmit={onSubmit} noValidate className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
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

              <div className="mt-4">
                <label htmlFor="quantity" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Quantity
                </label>
                <input
                  id="quantity"
                  type="number"
                  min={1}
                  max={20}
                  className="input-underline"
                  value={quantity}
                  onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
                />
              </div>
            </div>

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

            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="font-display font-bold text-navy-900">Payment</h2>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  { value: "esewa", title: "Pay with eSewa", hint: "Confirm your booking instantly" },
                  { value: "cash", title: "Cash on delivery", hint: "Pay when we hand over the gear" },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`cursor-pointer rounded-2xl border-2 p-4 transition ${
                      paymentMethod === option.value
                        ? "border-forest-600 bg-forest-50"
                        : "border-slate-200 hover:border-forest-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      className="sr-only"
                      checked={paymentMethod === option.value}
                      onChange={() => setPaymentMethod(option.value as "esewa" | "cash")}
                    />
                    <span className="block font-display font-bold text-navy-900">{option.title}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">{option.hint}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Summary */}
          <aside className="h-fit rounded-3xl border border-slate-100 bg-white p-6 shadow-sm lg:sticky lg:top-24">
            <div className="flex gap-3">
              {imageSrc ? (
                <img src={imageSrc} alt="" className="h-16 w-16 rounded-xl object-cover" />
              ) : null}
              <div className="min-w-0">
                <p className="truncate font-display font-bold text-navy-900">{gear.name}</p>
                <p className="text-sm text-slate-500">Rs. {gear.discountedPrice} / day</p>
              </div>
            </div>

            <dl className="mt-5 space-y-2 border-t border-slate-100 pt-5 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Quantity</dt>
                <dd className="font-medium text-navy-900">{quantity}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Days</dt>
                <dd className="font-medium text-navy-900">{days > 0 ? days : "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Delivery</dt>
                <dd className="font-medium text-forest-700">Free</dd>
              </div>
            </dl>

            <div className="mt-4 flex items-baseline justify-between border-t border-slate-100 pt-4">
              <span className="font-display font-bold text-navy-900">Total</span>
              <span className="font-display text-2xl font-extrabold text-forest-700">
                Rs. {total.toLocaleString("en-IN")}
              </span>
            </div>

            {error ? (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {error}
              </p>
            ) : null}

            <button type="submit" className="btn-primary mt-5 w-full" disabled={submitting || days < 1}>
              {submitting
                ? "Please wait…"
                : paymentMethod === "esewa"
                  ? "Pay with eSewa"
                  : "Confirm booking"}
            </button>

            <p className="mt-3 text-center text-xs text-slate-400">
              Final price is confirmed by our team before delivery.
            </p>
          </aside>
        </form>
      </div>
    </section>
  )
}
