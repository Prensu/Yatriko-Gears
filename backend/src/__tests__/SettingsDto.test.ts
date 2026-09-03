import { describe, expect, it } from "vitest"
import { SettingsUpdateDTO } from "../modules/settings/SettingsDto"

describe("SettingsUpdateDTO", () => {
  it("applies defaults when no fields are provided", () => {
    const result = SettingsUpdateDTO.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.leadModalEnabled).toBe(true)
      expect(result.data.leadModalShowDelayMs).toBe(5000)
      expect(result.data.leadModalCooldownDays).toBe(7)
    }
  })

  it("coerces numeric strings from multipart bodies", () => {
    const result = SettingsUpdateDTO.safeParse({
      leadModalShowDelayMs: "3000",
      leadModalCooldownDays: "14",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.leadModalShowDelayMs).toBe(3000)
      expect(result.data.leadModalCooldownDays).toBe(14)
    }
  })

  it('treats "true" as true for booleans', () => {
    const result = SettingsUpdateDTO.safeParse({ leadModalEnabled: "true" })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.leadModalEnabled).toBe(true)
    }
  })

  it('treats empty string as false for booleans (the multipart convention)', () => {
    const result = SettingsUpdateDTO.safeParse({ leadModalEnabled: "" })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.leadModalEnabled).toBe(false)
    }
  })

  it('treats the literal "false" as false — not the z.coerce.boolean() trap', () => {
    const result = SettingsUpdateDTO.safeParse({ leadModalEnabled: "false" })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.leadModalEnabled).toBe(false)
    }
  })

  it("passes native boolean values through", () => {
    const trueResult = SettingsUpdateDTO.safeParse({ leadModalEnabled: true })
    const falseResult = SettingsUpdateDTO.safeParse({ leadModalEnabled: false })
    expect(trueResult.success).toBe(true)
    expect(falseResult.success).toBe(true)
    if (trueResult.success) expect(trueResult.data.leadModalEnabled).toBe(true)
    if (falseResult.success) expect(falseResult.data.leadModalEnabled).toBe(false)
  })

  it("rejects negative delay and cooldown values", () => {
    const result = SettingsUpdateDTO.safeParse({
      leadModalShowDelayMs: -1,
      leadModalCooldownDays: -5,
    })
    expect(result.success).toBe(false)
  })

  it("accepts a full valid payload", () => {
    const result = SettingsUpdateDTO.safeParse({
      leadModalEnabled: "true",
      leadModalHeadline: "Summer Sale",
      leadModalBody: "Get 20% off all tents this weekend!",
      leadModalShowDelayMs: "8000",
      leadModalCooldownDays: "3",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({
        leadModalEnabled: true,
        leadModalHeadline: "Summer Sale",
        leadModalBody: "Get 20% off all tents this weekend!",
        leadModalShowDelayMs: 8000,
        leadModalCooldownDays: 3,
      })
    }
  })
})
