import BookingModel from "./BookingModel"
import GearModel from "../gear/GearModel"

/**
 * Rental availability.
 *
 * A unit is unavailable if it is committed to another booking whose date range
 * overlaps the requested one. Overlap is the standard test:
 *     existing.startDate <= requestedEnd  AND  existing.endDate >= requestedStart
 *
 * Cancelled bookings free their stock again; every other status still holds it,
 * including `pending`, so an unpaid booking can't be silently double-sold.
 */
const HOLDING_STATUSES = ["pending", "confirmed", "active"]

export type AvailabilityResult = {
  gearId: string
  name: string
  quantityTotal: number
  quantityBooked: number
  quantityAvailable: number
}

/** How many units of each gear id are free across the given dates. */
export async function getAvailability(
  gearIds: string[],
  startDate: Date,
  endDate: Date,
  /** Ignore one booking — used when editing/re-checking an existing order. */
  excludeBookingId?: string,
): Promise<Map<string, AvailabilityResult>> {
  const gearDocs = await GearModel.find({ _id: { $in: gearIds } })

  const match: Record<string, unknown> = {
    status: { $in: HOLDING_STATUSES },
    "items.gear": { $in: gearIds },
    startDate: { $lte: endDate },
    endDate: { $gte: startDate },
  }
  if (excludeBookingId) match._id = { $ne: excludeBookingId }

  const overlapping = await BookingModel.find(match, { items: 1 })

  // Sum the committed quantity per gear id across every overlapping booking.
  const booked = new Map<string, number>()
  for (const booking of overlapping) {
    for (const item of booking.items) {
      const id = String(item.gear)
      booked.set(id, (booked.get(id) ?? 0) + item.quantity)
    }
  }

  const result = new Map<string, AvailabilityResult>()
  for (const gear of gearDocs) {
    const id = String(gear._id)
    const quantityTotal = gear.get("quantityTotal") ?? 1
    const quantityBooked = booked.get(id) ?? 0
    result.set(id, {
      gearId: id,
      name: gear.name,
      quantityTotal,
      quantityBooked,
      quantityAvailable: Math.max(0, quantityTotal - quantityBooked),
    })
  }

  return result
}

/**
 * Throws a 422 naming the first item that can't be fulfilled, so the customer
 * is told *which* thing is unavailable rather than just "booking failed".
 */
export async function assertAvailable(
  items: Array<{ gear: string; quantity: number }>,
  startDate: Date,
  endDate: Date,
  excludeBookingId?: string,
): Promise<void> {
  const availability = await getAvailability(
    items.map((item) => item.gear),
    startDate,
    endDate,
    excludeBookingId,
  )

  for (const item of items) {
    const info = availability.get(item.gear)
    if (!info) throw { code: 422, message: "One or more items are no longer available" }

    if (item.quantity > info.quantityAvailable) {
      throw {
        code: 422,
        message:
          info.quantityAvailable === 0
            ? `${info.name} is fully booked for those dates.`
            : `Only ${info.quantityAvailable} × ${info.name} available for those dates (you asked for ${item.quantity}).`,
      }
    }
  }
}
