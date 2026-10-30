import { describe, it, expect } from "vitest"
import { normaliseToE164Nepal } from "../services/WhatsAppService"

describe("normaliseToE164Nepal", () => {
  it("passes through an already-normalised number", () => {
    expect(normaliseToE164Nepal("9779841234567")).toBe("9779841234567")
  })

  it("prepends 977 to a plain 10-digit Nepali number", () => {
    expect(normaliseToE164Nepal("9841234567")).toBe("9779841234567")
  })

  it("strips the leading + from +9779841234567", () => {
    expect(normaliseToE164Nepal("+9779841234567")).toBe("9779841234567")
  })

  it("strips spaces and dashes from +977 984-123-4567", () => {
    expect(normaliseToE164Nepal("+977 984-123-4567")).toBe("9779841234567")
  })

  it("handles '977 9841234567' (space between country code and number)", () => {
    expect(normaliseToE164Nepal("977 9841234567")).toBe("9779841234567")
  })

  it("handles the format accepted by BookingCreateDTO: +977-9841234567", () => {
    expect(normaliseToE164Nepal("+977-9841234567")).toBe("9779841234567")
  })
})
