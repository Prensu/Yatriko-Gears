import { z } from "zod"
import { api } from "@/lib/api"
import { bookingSchema, type Booking, type BookingStatus } from "@/types"
import type { ListParams, Paged } from "@/api/shared"

/** GET /booking?status=&paymentStatus=&search=&page=&limit= — admin inbox. */
export async function fetchBookingList(
  params: ListParams = {},
  signal?: AbortSignal,
): Promise<Paged<Booking>> {
  const res = await api.get("/booking", z.array(bookingSchema), { params, signal })
  return { rows: res.data, meta: res.meta }
}

/** PATCH /booking/:id/status */
export async function updateBookingStatus(id: string, status: BookingStatus): Promise<Booking> {
  const res = await api.patch(`/booking/${encodeURIComponent(id)}/status`, bookingSchema, { status })
  return res.data
}

/** DELETE /booking/:id */
export async function deleteBooking(id: string): Promise<string> {
  const res = await api.delete(`/booking/${encodeURIComponent(id)}`, z.null())
  return res.message
}
