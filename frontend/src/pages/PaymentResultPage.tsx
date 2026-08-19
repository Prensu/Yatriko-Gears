import { useEffect, useRef, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { verifyEsewa } from "@/api/booking"
import { ApiRequestError } from "@/lib/api"
import type { Booking } from "@/types"

type State = "verifying" | "paid" | "failed"

/**
 * eSewa sends the customer back here with ?data=<base64 json>. We hand that
 * straight to the API, which confirms the transaction with eSewa
 * server-to-server before marking anything paid.
 */
export default function PaymentResultPage({ outcome }: { outcome: "success" | "failure" }) {
  const [params] = useSearchParams()
  const [state, setState] = useState<State>(outcome === "success" ? "verifying" : "failed")
  const [booking, setBooking] = useState<Booking | null>(null)
  const [message, setMessage] = useState("")
  const verified = useRef(false)

  useEffect(() => {
    if (outcome !== "success" || verified.current) return
    verified.current = true // StrictMode double-invoke must not double-verify

    const data = params.get("data")
    if (!data) {
      setState("failed")
      setMessage("eSewa did not send a payment reference back.")
      return
    }

    verifyEsewa(data)
      .then((confirmed) => {
        setBooking(confirmed)
        setState("paid")
      })
      .catch((error: unknown) => {
        setState("failed")
        setMessage(
          error instanceof ApiRequestError
            ? error.message
            : "We could not confirm this payment. If money left your account, contact us with your booking code.",
        )
      })
  }, [outcome, params])

  return (
    <section className="section-pad bg-sand">
      <div className="container-site max-w-lg">
        <div className="rounded-3xl border border-slate-100 bg-white p-10 text-center shadow-sm">
          {state === "verifying" ? (
            <>
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-forest-100 border-t-forest-600" />
              <h1 className="mt-6 font-display text-2xl font-extrabold text-navy-900">
                Confirming your payment…
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Checking with eSewa. This only takes a moment.
              </p>
            </>
          ) : state === "paid" ? (
            <>
              <p className="text-5xl">✅</p>
              <h1 className="mt-4 font-display text-2xl font-extrabold text-navy-900">Payment confirmed</h1>
              {booking ? (
                <p className="mt-2 text-slate-600">
                  Booking <strong>{booking.code}</strong> is confirmed — Rs.{" "}
                  {booking.total.toLocaleString("en-IN")} paid.
                </p>
              ) : null}
              <p className="mt-2 text-sm text-slate-500">
                We'll call you to arrange delivery. Gear up. Head out. Make memories.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Link to="/bookings" className="btn-primary">
                  View my bookings
                </Link>
                <Link to="/gear" className="btn-secondary">
                  Rent more gear
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="text-5xl">⚠️</p>
              <h1 className="mt-4 font-display text-2xl font-extrabold text-navy-900">
                Payment not completed
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                {message || "The payment was cancelled or did not go through. Your booking is saved as unpaid."}
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Link to="/bookings" className="btn-primary">
                  Try paying again
                </Link>
                <Link to="/contact" className="btn-secondary">
                  Contact us
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
