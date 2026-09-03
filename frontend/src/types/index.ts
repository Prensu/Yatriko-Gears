import { z } from "zod"

/**
 * Domain types mirroring the backend Mongoose models + Zod DTOs.
 * Backend responds with envelope: { data, message, meta }.
 */

export const gearCategorySchema = z.object({
  _id: z.string(),
  name: z.string(),
  slug: z.string(),
})
export type GearCategory = z.infer<typeof gearCategorySchema>

export const gearSchema = z.object({
  _id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().optional().default(""),
  realPrice: z.number(),
  discountedPrice: z.number(),
  availableFor: z.array(z.enum(["rent", "sale"])).default(["rent"]),
  colors: z.array(z.string()).optional().default([]),
  specs: z.record(z.string()).optional().default({}),
  image: z.string().optional().default(""),
  // Uncategorised gear comes back as null, not undefined — .optional() alone
  // would reject it and take the whole list down with it.
  category: z.union([z.string(), gearCategorySchema]).nullish(),
  isNew: z.boolean().optional().default(false),
  // Optional on purpose: the bundled fallback list predates stock tracking,
  // and the booking form reads live availability from the API instead.
  quantityTotal: z.number().optional(),
})
export type Gear = z.infer<typeof gearSchema>

export const packageSchema = z.object({
  _id: z.string(),
  name: z.string(),
  slug: z.string(),
  price: z.number(),
  items: z.array(z.string()),
  description: z.string().optional().default(""),
})
export type Package = z.infer<typeof packageSchema>

export const destinationSchema = z.object({
  _id: z.string(),
  name: z.string(),
  slug: z.string(),
  image: z.string().optional().default(""),
  blurb: z.string().optional().default(""),
})
export type Destination = z.infer<typeof destinationSchema>

export const videoSchema = z.object({
  _id: z.string(),
  title: z.string(),
  cloudinaryUrl: z.string().url(),
  category: z.string().optional().default("All"),
})
export type Video = z.infer<typeof videoSchema>

/* ------------------------------------------------------------------ */
/* Bookings                                                             */
/* ------------------------------------------------------------------ */

export const bookingItemSchema = z.object({
  gear: z.string(),
  name: z.string(),
  pricePerDay: z.number(),
  quantity: z.number(),
})

export const bookingStatusSchema = z.enum([
  "pending",
  "confirmed",
  "active",
  "completed",
  "cancelled",
])
export type BookingStatus = z.infer<typeof bookingStatusSchema>

export const bookingSchema = z.object({
  _id: z.string(),
  code: z.string(),
  items: z.array(bookingItemSchema),
  startDate: z.string(),
  endDate: z.string(),
  days: z.number(),
  subtotal: z.number(),
  deliveryCharge: z.number().default(0),
  total: z.number(),
  status: bookingStatusSchema,
  paymentStatus: z.enum(["unpaid", "paid", "refunded"]),
  deliveryAddress: z.string().default(""),
  customerPhone: z.string().default(""),
  note: z.string().nullish().transform((v) => v ?? ""),
  createdAt: z.string().optional(),
})
export type Booking = z.infer<typeof bookingSchema>

/** GET /booking/availability — how many units are free for a date range. */
export const availabilitySchema = z.object({
  gearId: z.string(),
  name: z.string(),
  quantityTotal: z.number(),
  quantityBooked: z.number(),
  quantityAvailable: z.number(),
})
export type Availability = z.infer<typeof availabilitySchema>


/* ------------------------------------------------------------------ */
/* Site settings (singleton — lead popup config)                        */
/* ------------------------------------------------------------------ */

export const settingsSchema = z.object({
  leadModalEnabled: z.boolean(),
  leadModalImage: z.string().default(""),
  leadModalHeadline: z.string(),
  leadModalBody: z.string(),
  leadModalShowDelayMs: z.number(),
  leadModalCooldownDays: z.number(),
})
export type SiteSettings = z.infer<typeof settingsSchema>

/** Envelope: every backend response is { data, message, meta } */
export const envelopeSchema = <T extends z.ZodTypeAny>(data: T) =>
  z.object({
    data,
    message: z.string(),
    meta: z
      .object({
        page: z.number().optional(),
        limit: z.number().optional(),
        total: z.number().optional(),
      })
      .nullish(),
  })

/** Error body: { code, message, detail? } */
export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  detail: z.unknown().optional(),
})
export type ApiError = z.infer<typeof apiErrorSchema>
