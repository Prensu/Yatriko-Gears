import { z } from "zod"

/** Contact form — POST /api/v1/contact */
export const contactFormSchema = z.object({
  name: z.string().min(2, "Please enter your full name").max(80),
  email: z.string().email("Enter a valid email address"),
  phone: z
    .string()
    .regex(/^(\+977[- ]?)?9\d{9}$/, "Enter a valid Nepali mobile number"),
  subject: z.string().min(3, "Subject is too short").max(120),
  message: z.string().min(10, "Tell us a bit more (min 10 characters)").max(2000),
})
export type ContactFormValues = z.infer<typeof contactFormSchema>

/** Lead-capture modal — POST /api/v1/subscriber */
export const subscriberFormSchema = z.object({
  email: z.string().email("Enter a valid email to claim the offer"),
})
export type SubscriberFormValues = z.infer<typeof subscriberFormSchema>

/** Booking enquiry — POST /api/v1/booking (future) */
export const bookingFormSchema = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().regex(/^(\+977[- ]?)?9\d{9}$/, "Enter a valid Nepali mobile number"),
  gearSlugs: z.array(z.string()).min(1, "Pick at least one gear item"),
  startDate: z.string(),
  endDate: z.string(),
  note: z.string().max(1000).optional(),
})
export type BookingFormValues = z.infer<typeof bookingFormSchema>

/** Cart checkout details — POST /api/v1/booking */
export const cartCheckoutSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name").max(80, "Name is too long"),
  phone: z.string().trim().regex(/^((\+977[- ]?)?9\d{9})$/, "Enter a valid Nepali mobile number"),
  deliveryAddress: z.string().trim().min(4, "Where should we deliver?").max(200, "Address is too long"),
  note: z.string().max(500, "Note is too long"),
  startDate: z.string(),
  endDate: z.string(),
}).superRefine((values, ctx) => {
  if (values.startDate && values.endDate && new Date(values.endDate) < new Date(values.startDate)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endDate"], message: "Return date cannot be before the pickup date" })
  }
})
export type CartCheckoutValues = z.infer<typeof cartCheckoutSchema>

/** Generic helper: validate + flatten Zod errors for form UIs */
export function validateForm<S extends z.ZodTypeAny>(
  schema: S,
  values: unknown,
): { ok: true; data: z.infer<S> } | { ok: false; errors: Record<string, string> } {
  const parsed = schema.safeParse(values)
  if (parsed.success) return { ok: true, data: parsed.data }
  const errors: Record<string, string> = {}
  for (const issue of parsed.error.issues) {
    const key = issue.path.join(".") || "_form"
    if (!errors[key]) errors[key] = issue.message
  }
  return { ok: false, errors }
}
