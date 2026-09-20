import { describe, expect, it } from "vitest"
import { ApiRequestError } from "@/lib/api"
import { bookingSchema, gearSchema, packageSchema } from "@/types"

describe("ApiRequestError", () => {
  it("carries the status and code the UI branches on", () => {
    const error = new ApiRequestError(422, "VALIDATION", "Only 1 available", { gear: "too many" })
    expect(error.status).toBe(422)
    expect(error.code).toBe("VALIDATION")
    expect(error.message).toBe("Only 1 available")
    expect(error).toBeInstanceOf(Error)
  })
})

describe("gearSchema", () => {
  const base = {
    _id: "1", name: "Tent", slug: "tent", realPrice: 800, discountedPrice: 650,
    availableFor: ["rent"], colors: [], specs: {}, image: "", isNew: false,
  }

  it("accepts a gear row with no category", () => {
    // The exact bug that once made the whole catalogue fall back to dummy
    // data: an uncategorised item arrives as null, not undefined.
    expect(gearSchema.safeParse({ ...base, category: null }).success).toBe(true)
  })

  it("accepts a populated category object and a bare id", () => {
    expect(gearSchema.safeParse({ ...base, category: { _id: "c1", name: "Tents", slug: "tents" } }).success).toBe(true)
    expect(gearSchema.safeParse({ ...base, category: "c1" }).success).toBe(true)
  })

  it("rejects a row missing a price", () => {
    const { discountedPrice: _omitted, ...withoutPrice } = base
    expect(gearSchema.safeParse(withoutPrice).success).toBe(false)
  })
})

describe("bookingSchema", () => {
  it("parses a booking as the API returns it", () => {
    const parsed = bookingSchema.safeParse({
      _id: "b1", code: "YG-260819-A1B2",
      items: [{ gear: "g1", name: "Tent", pricePerDay: 700, quantity: 2 }],
      startDate: "2026-09-01T00:00:00.000Z", endDate: "2026-09-03T00:00:00.000Z",
      days: 3, subtotal: 4200, deliveryCharge: 0, total: 4200,
      status: "pending", paymentStatus: "unpaid",
      deliveryAddress: "Khokana", customerPhone: "9841234567", note: null,
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.total).toBe(4200)
      expect(parsed.data.note).toBe("")  // null is normalised to ""
    }
  })

  it("rejects an unknown status", () => {
    expect(bookingSchema.safeParse({ status: "exploded" }).success).toBe(false)
  })
})

describe("packageSchema", () => {
  it("parses a package as the API returns it", () => {
    const parsed = packageSchema.safeParse({
      _id: "pkg1",
      name: "Full Camping Combo",
      slug: "full-camping-combo",
      price: 4300,
      items: ["Tent", "Sleeping Bag"],
      description: "Everything you need",
      status: "active",
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.name).toBe("Full Camping Combo")
      expect(parsed.data.price).toBe(4300)
      expect(parsed.data.items).toHaveLength(2)
      expect(parsed.data.status).toBe("active")
    }
  })

  it("handles nullish items and description gracefully", () => {
    const parsed = packageSchema.safeParse({
      _id: "pkg2",
      name: "Minimal Package",
      slug: "minimal-package",
      price: 1500,
      items: null,
      description: null,
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.items).toEqual([])
      expect(parsed.data.description).toBe("")
      expect(parsed.data.status).toBe("active")
    }
  })
})

