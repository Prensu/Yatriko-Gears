import { z } from "zod"

/** Mirrors the frontend's contactFormSchema exactly. */
export const ContactCreateDTO = z.object({
  name: z.string().min(2, "Please enter your full name").max(80),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().regex(/^(\+977[- ]?)?9\d{9}$/, "Enter a valid Nepali mobile number"),
  subject: z.string().min(3, "Subject is too short").max(120),
  message: z.string().min(10, "Tell us a bit more (min 10 characters)").max(2000),
})

export const ContactStatusDTO = z.object({
  status: z.enum(["new", "read", "resolved"]),
})
