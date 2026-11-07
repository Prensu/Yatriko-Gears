import { describe, expect, it } from "vitest"
import { resolveBookingColor, sumGearQuantities } from "../modules/booking/BookingSelection"

describe("booking color selections", () => {
  const chair = { name: "Chair", colors: ["Red", "Blue"] }
  it("keeps a selected catalogue color", () => {
    expect(resolveBookingColor(chair, "Red")).toBe("Red")
  })
  it.each([undefined, "", "Green"])("rejects a missing or unavailable color: %s", (color) => {
    expect(() => resolveBookingColor(chair, color)).toThrow()
  })
  it("allows gear with no color options", () => {
    expect(resolveBookingColor({ name: "Stove", colors: [] })).toBeUndefined()
  })
  it("counts different color lines against the same gear stock", () => {
    expect(sumGearQuantities([
      { gear: "chair", quantity: 2 }, { gear: "chair", quantity: 3 }, { gear: "tent", quantity: 1 },
    ])).toEqual([{ gear: "chair", quantity: 5 }, { gear: "tent", quantity: 1 }])
  })
})
