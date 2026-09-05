/**
 * Pure rental maths, kept out of the controller so it can be unit tested
 * without a database. This is the money path — every number a customer is
 * charged comes from here.
 */

export type PricedItem = {
  pricePerDay: number
  quantity: number
}

/**
 * Inclusive day count: picking up and returning on the same day is one day's
 * rental, not zero.
 */
export function countDays(start: Date, end: Date): number {
  // Compare calendar dates, not raw milliseconds. Differencing timestamps
  // miscounts as soon as either date carries a time component — and with
  // Nepal on UTC+05:45, an off-by-one here means overcharging a customer
  // for a day they never had the gear.
  const startDay = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())
  const endDay = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate())
  return Math.max(1, Math.floor((endDay - startDay) / 86400000) + 1)
}

/** subtotal = sum(pricePerDay x quantity) x days */
export function calculateSubtotal(items: PricedItem[], days: number): number {
  return items.reduce((sum, item) => sum + item.pricePerDay * item.quantity * days, 0)
}

/** Delivery is quoted separately over WhatsApp. */
export function calculateTotal(subtotal: number): number {
  return subtotal
}
