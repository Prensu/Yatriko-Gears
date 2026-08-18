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
