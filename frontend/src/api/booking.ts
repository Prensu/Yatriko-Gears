import { z } from "zod"
import { api } from "@/lib/api"
import { bookingSchema, esewaFormSchema, type Booking, type EsewaForm } from "@/types"

export type BookingInput = {
  items: { gear: string; quantity: number }[]
  startDate: string
  endDate: string
  deliveryAddress: string
  phone: string
  note?: string
  paymentMethod: "esewa" | "cash"
}

/** POST /booking — the server prices it; we only say what and how many. */
export async function createBooking(input: BookingInput): Promise<Booking> {
  const { data } = await api.post("/booking", bookingSchema, input)
  return data
}

/** GET /booking/my */
export async function fetchMyBookings(): Promise<Booking[]> {
  const { data } = await api.get("/booking/my?limit=50", z.array(bookingSchema))
  return data
}

/** POST /payment/esewa/initiate — returns the signed fields to POST to eSewa. */
export async function initiateEsewa(bookingId: string): Promise<EsewaForm> {
  const { data } = await api.post("/payment/esewa/initiate", esewaFormSchema, { bookingId })
  return data
}

/** POST /payment/esewa/verify — the server confirms with eSewa before settling. */
export async function verifyEsewa(payload: string): Promise<Booking> {
  const { data } = await api.post("/payment/esewa/verify", bookingSchema, { data: payload })
  return data
}

/**
 * Hand the browser over to eSewa's hosted checkout. It only accepts a real
 * form POST, so we build one, submit it, and the page navigates away.
 */
export function redirectToEsewa(form: EsewaForm): void {
  const element = document.createElement("form")
  element.method = "POST"
  element.action = form.formUrl

  for (const [name, value] of Object.entries(form.fields)) {
    const input = document.createElement("input")
    input.type = "hidden"
    input.name = name
    input.value = value
    element.appendChild(input)
  }

  document.body.appendChild(element)
  element.submit()
}
