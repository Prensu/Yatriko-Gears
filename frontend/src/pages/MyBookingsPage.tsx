import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { cancelBooking, fetchMyBookings, initiateEsewa, redirectToEsewa } from "@/api/booking"
import { ApiRequestError } from "@/lib/api"
import type { Booking } from "@/types"
import { usePageMeta } from "@/hooks/usePageMeta"

const STATUS_TONE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  confirmed: "bg-forest-50 text-forest-700",
  active: "bg-sky-50 text-sky-700",
  completed: "bg-slate-100 text-slate-600",
  cancelled: "bg-red-50 text-red-700",
}

const PAYMENT_TONE: Record<string, string> = {
  paid: "bg-forest-50 text-forest-700",
  unpaid: "bg-amber-50 text-amber-700",
  refunded: "bg-slate-100 text-slate-600",
}

function formatDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

export default function MyBookingsPage() {
  usePageMeta({
    title: "My Bookings",
    description: "Your Yatriko Gears rentals, their status and payment.",
    path: "/bookings",
    noIndex: true,
  })

  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [payingId, setPayingId] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [params] = useSearchParams()
  const justBooked = params.get("new")

  useEffect(() => {
    fetchMyBookings()
      .then(setBookings)
      .catch((cause: unknown) =>
        setError(cause instanceof ApiRequestError ? cause.message : "Could not load your bookings"),
      )
      .finally(() => setLoading(false))
  }, [])

  const cancel = async (booking: Booking) => {
    if (!window.confirm(`Cancel booking ${booking.code}? This frees the gear for someone else.`)) return
    setCancellingId(booking._id)
    setError("")
    try {
      const updated = await cancelBooking(booking._id)
      setBookings((current) => current.map((b) => (b._id === updated._id ? updated : b)))
    } catch (cause) {
      setError(cause instanceof ApiRequestError ? cause.message : "Could not cancel this booking")
    } finally {
      setCancellingId(null)
    }
  }

  const payNow = async (booking: Booking) => {
    setPayingId(booking._id)
    try {
      const form = await initiateEsewa(booking._id)
      redirectToEsewa(form)
    } catch (cause) {
      setError(cause instanceof ApiRequestError ? cause.message : "Could not start the payment")
      setPayingId(null)
    }
  }

  return (
    <section className="section-pad bg-sand">
      <div className="container-site max-w-4xl">
        <h1 className="font-display text-3xl font-extrabold text-navy-900">My bookings</h1>
        <p className="mt-1 text-slate-500">Your rentals, their status and payment.</p>

        {justBooked ? (
          <p className="mt-6 rounded-2xl border border-forest-200 bg-forest-50 px-4 py-3 text-sm text-forest-800">
            🎉 Booking <strong>{justBooked}</strong> received — we'll call you to confirm the details.
          </p>
        ) : null}

        {error ? (
          <p className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : null}

        {loading ? (
          <div className="mt-8 space-y-4">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="h-40 animate-pulse rounded-3xl bg-white" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-slate-100 bg-white p-10 text-center shadow-sm">
            <p className="text-4xl">⛺</p>
            <p className="mt-3 font-display text-lg font-bold text-navy-900">No bookings yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Pick your gear and we'll deliver it across the valley.
            </p>
            <Link to="/gear" className="btn-primary mt-6">
              Browse gear
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {bookings.map((booking) => (
              <article
                key={booking._id}
                className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-lg font-bold text-navy-900">{booking.code}</p>
                    <p className="text-xs text-slate-500">
                      Booked {booking.createdAt ? formatDate(booking.createdAt) : "—"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                        STATUS_TONE[booking.status] ?? "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {booking.status}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                        PAYMENT_TONE[booking.paymentStatus] ?? "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {booking.paymentStatus}
                    </span>
                  </div>
                </div>

                <ul className="mt-4 space-y-1 text-sm text-slate-600">
                  {booking.items.map((item) => (
                    <li key={item.gear} className="flex justify-between gap-3">
                      <span>
                        {item.name} × {item.quantity}
                      </span>
                      <span className="text-slate-400">Rs. {item.pricePerDay} / day</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-t border-slate-100 pt-4">
                  <div className="text-sm text-slate-500">
                    {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
                    <span className="ml-2 text-slate-400">
                      ({booking.days} day{booking.days > 1 ? "s" : ""})
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-display text-xl font-extrabold text-forest-700">
                      Rs. {booking.total.toLocaleString("en-IN")}
                    </span>
                    {booking.paymentStatus === "unpaid" && booking.status !== "cancelled" ? (
                      <button
                        type="button"
                        onClick={() => void payNow(booking)}
                        className="btn-primary !px-5 !py-2 text-sm"
                        disabled={payingId === booking._id}
                      >
                        {payingId === booking._id ? "Starting…" : "Pay with eSewa"}
                      </button>
                    ) : null}
                    {booking.status === "pending" && booking.paymentStatus === "unpaid" ? (
                      <button
                        type="button"
                        onClick={() => void cancel(booking)}
                        className="text-sm font-semibold text-slate-400 transition hover:text-red-600"
                        disabled={cancellingId === booking._id}
                      >
                        {cancellingId === booking._id ? "Cancelling…" : "Cancel"}
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
