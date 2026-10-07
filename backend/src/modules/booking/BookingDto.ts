import { z } from "zod"

/** YYYY-MM-DD from a date input, parsed to a real date. */
const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the date picker (YYYY-MM-DD)")
  .refine((value) => !Number.isNaN(new Date(value).getTime()), "Enter a valid date")

export const BookingCreateDTO = z
  .object({
    name: z.string().trim().min(2, "Please enter your full name").max(80, "Name is too long"),
    items: z
      .array(
        z.object({
          gear: z.string().min(1, "Gear is compulsory"),
          quantity: z.coerce.number().int().min(1, "At least 1").max(20, "Max 20 per item"),
          mode: z.enum(["rent", "sale"]).default("rent"),
        }),
      )
      .min(1, "Add at least one item"),
    startDate: dateOnly.optional(),
    endDate: dateOnly.optional(),
    deliveryAddress: z.string().min(4, "Where should we deliver?").max(200),
    phone: z.string().regex(/^(\+977[- ]?)?9\d{9}$/, "Enter a valid Nepali mobile number"),
    note: z.string().max(500).optional().default(""),
  })
  .superRefine((v, ctx) => {
    if (v.items.some((item) => item.mode === "rent")) {
      if (!v.startDate) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["startDate"], message: "Pickup date is required" })
      if (!v.endDate) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endDate"], message: "Return date is required" })
      if (v.startDate && v.endDate && new Date(v.endDate) < new Date(v.startDate)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endDate"], message: "Return date cannot be before the pickup date" })
      }
    }
  })

export const BookingStatusDTO = z.object({
  status: z.enum(["pending", "confirmed", "active", "completed", "cancelled"]),
})
