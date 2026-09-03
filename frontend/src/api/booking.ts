import { z } from "zod"
import { api } from "@/lib/api"
import {
  availabilitySchema,
  bookingSchema,
  type Availability,
  type Booking,
} from "@/types"

export type BookingInput = {
  items: { gear: string; quantity: number }[]
  startDate: string
  endDate: string
  deliveryAddress: string
  phone: string
  note?: string
}

/** POST /booking — the server prices it; we only say what and how many. */
export async function createBooking(input: BookingInput): Promise<Booking> {
  const { data } = await api.post("/booking", bookingSchema, input)
  return data
}

/** GET /booking/availability — how many units are free across these dates. */
export async function fetchAvailability(
  gearId: string,
  startDate: string,
  endDate: string,
): Promise<Availability> {
  const qs = new URLSearchParams({ gear: gearId, startDate, endDate })
  const { data } = await api.get(`/booking/availability?${qs}`, availabilitySchema)
  return data
}

/** GET /booking/my */
export async function fetchMyBookings(): Promise<Booking[]> {
  const { data } = await api.get("/booking/my?limit=50", z.array(bookingSchema))
  return data
}

/** PATCH /booking/:id/cancel — only works while pending and unpaid. */
export async function cancelBooking(bookingId: string): Promise<Booking> {
  const { data } = await api.patch(`/booking/${encodeURIComponent(bookingId)}/cancel`, bookingSchema, {})
  return data
}
