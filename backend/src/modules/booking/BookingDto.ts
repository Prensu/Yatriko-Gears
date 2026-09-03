import { z } from "zod"

/** YYYY-MM-DD from a date input, parsed to a real date. */
const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the date picker (YYYY-MM-DD)")
  .refine((value) => !Number.isNaN(new Date(value).getTime()), "Enter a valid date")

export const BookingCreateDTO = z
  .object({
    items: z
      .array(
        z.object({
          gear: z.string().min(1, "Gear is compulsory"),
          quantity: z.coerce.number().int().min(1, "At least 1").max(20, "Max 20 per item"),
        }),
      )
      .min(1, "Add at least one item"),
    startDate: dateOnly,
    endDate: dateOnly,
    deliveryAddress: z.string().min(4, "Where should we deliver?").max(200),
    phone: z.string().regex(/^(\+977[- ]?)?9\d{9}$/, "Enter a valid Nepali mobile number"),
    note: z.string().max(500).optional().default(""),
  })
  .refine((v) => new Date(v.endDate) >= new Date(v.startDate), {
    path: ["endDate"],
    message: "Return date cannot be before the pickup date",
  })

export const BookingStatusDTO = z.object({
  status: z.enum(["pending", "confirmed", "active", "completed", "cancelled"]),
})
