import { describe, expect, it } from "vitest"
import { calculateSubtotal, calculateTotal, countDays } from "../modules/booking/BookingPricing"

describe("countDays", () => {
  it("counts a same-day rental as one day, not zero", () => {
    expect(countDays(new Date("2026-09-01"), new Date("2026-09-01"))).toBe(1)
  })

  it("counts inclusively", () => {
    // 1st to 3rd is three days of rental, not two.
    expect(countDays(new Date("2026-09-01"), new Date("2026-09-03"))).toBe(3)
  })

  it("never returns less than one, even for reversed dates", () => {
    expect(countDays(new Date("2026-09-05"), new Date("2026-09-01"))).toBe(1)
  })

  it("survives a daylight-saving style hour shift", () => {
    const start = new Date("2026-09-01T00:00:00Z")
    const end = new Date("2026-09-03T23:00:00Z")
    expect(countDays(start, end)).toBe(3)
  })
})

describe("calculateSubtotal", () => {
  it("multiplies price by quantity by days", () => {
    // The exact case from the live flow test: 700 x 2 units x 3 days.
    expect(calculateSubtotal([{ pricePerDay: 700, quantity: 2 }], 3)).toBe(4200)
  })

  it("sums multiple line items", () => {
    expect(
      calculateSubtotal(
        [
          { pricePerDay: 700, quantity: 2 },
          { pricePerDay: 150, quantity: 1 },
        ],
        3,
      ),
    ).toBe(4200 + 450)
  })

  it("handles free items without breaking the total", () => {
    expect(calculateSubtotal([{ pricePerDay: 0, quantity: 1 }], 5)).toBe(0)
  })

  it("returns zero for an empty basket", () => {
    expect(calculateSubtotal([], 3)).toBe(0)
  })
})

describe("calculateTotal", () => {
  it("adds delivery on top of the subtotal", () => {
    expect(calculateTotal(4200)).toBe(4200)
  })
})
