import { describe, expect, it } from "vitest"
import { loginFormSchema, registerFormSchema, resetPasswordSchema } from "@/types/auth"
import { contactFormSchema, validateForm } from "@/types/forms"

describe("validateForm", () => {
  it("returns typed data when valid", () => {
    const result = validateForm(loginFormSchema, { email: "a@b.com", password: "secret" })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data.email).toBe("a@b.com")
  })

  it("flattens errors into a field map the forms can render", () => {
    const result = validateForm(loginFormSchema, { email: "not-an-email", password: "" })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.email).toBeTruthy()
      expect(result.errors.password).toBeTruthy()
    }
  })
})

describe("Nepali mobile validation", () => {
  // Nepali mobiles are 10 digits starting with 9, optionally +977 prefixed.
  it.each(["9841234567", "+9779841234567", "+977-9841234567"])("accepts %s", (phone) => {
    const result = validateForm(registerFormSchema, {
      name: "Prensu", email: "a@b.com", phone, address: "",
      password: "password123", confirmPassword: "password123",
    })
    expect(result.ok, `${phone} should be valid`).toBe(true)
  })

  it.each(["12345", "8841234567", "+15551234567", ""])("rejects %s", (phone) => {
    const result = validateForm(registerFormSchema, {
      name: "Prensu", email: "a@b.com", phone, address: "",
      password: "password123", confirmPassword: "password123",
    })
    expect(result.ok, `${phone} should be invalid`).toBe(false)
  })
})

describe("password confirmation", () => {
  it("rejects a mismatch on register", () => {
    const result = validateForm(registerFormSchema, {
      name: "Prensu", email: "a@b.com", phone: "9841234567", address: "",
      password: "password123", confirmPassword: "different123",
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.confirmPassword).toMatch(/do not match/i)
  })

  it("rejects a mismatch on reset", () => {
    const result = validateForm(resetPasswordSchema, {
      resetToken: "abc", password: "password123", confirmPassword: "nope12345",
    })
    expect(result.ok).toBe(false)
  })

  it("rejects a password under 8 characters", () => {
    const result = validateForm(resetPasswordSchema, {
      resetToken: "abc", password: "short", confirmPassword: "short",
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.password).toMatch(/8 characters/i)
  })
})

describe("contact form", () => {
  it("requires a message with real content", () => {
    const result = validateForm(contactFormSchema, {
      name: "Prensu", email: "a@b.com", phone: "9841234567", subject: "Tents", message: "hi",
    })
    expect(result.ok).toBe(false)
  })
})
