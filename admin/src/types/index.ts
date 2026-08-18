import { z } from "zod"

/**
 * Domain schemas mirroring the backend Mongoose models + Zod DTOs.
 * Shapes are copied from yatriko-frontend/src/types/index.ts and widened
 * with the admin-only fields (status, timestamps, image sub-document).
 *
 * Every backend response is the envelope { data, message, meta }.
 */

/* ------------------------------------------------------------------ */
/* Shared fragments                                                     */
/* ------------------------------------------------------------------ */

/**
 * Some modules serialize `image` down to a plain URL string (gear,
 * destination) while others return the raw multer sub-document
 * (category, user). Normalize both to a URL string.
 */
export const imageUrlSchema = z.preprocess((value) => {
  if (typeof value === "string") return value
  if (value && typeof value === "object" && "url" in value) {
    const url = (value as { url?: unknown }).url
    return typeof url === "string" ? url : ""
  }
  return ""
}, z.string())

export const statusSchema = z.enum(["active", "inactive"])
export type Status = z.infer<typeof statusSchema>

/** Mongo timestamps are ISO strings over the wire. */
const timestamps = {
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
}

/* ------------------------------------------------------------------ */
/* Category                                                             */
/* ------------------------------------------------------------------ */

export const categorySchema = z.object({
  _id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullish().transform((value) => value ?? ""),
  status: statusSchema.default("active"),
  image: imageUrlSchema.optional().default(""),
  ...timestamps,
})
export type Category = z.infer<typeof categorySchema>

/* ------------------------------------------------------------------ */
/* Gear                                                                 */
/* ------------------------------------------------------------------ */

/** `category` arrives populated ({_id,name,slug}), as a raw id, or null. */
export const categoryRefSchema = z.preprocess(
  (value) => {
    if (!value) return null
    if (typeof value === "string") return { _id: value }
    return value
  },
  z
    .object({
      _id: z.string(),
      name: z.string().optional(),
      slug: z.string().optional(),
    })
    .nullable(),
)

/**
 * `specs` is a Mongoose Map; depending on how the document is serialized it
 * can arrive as an object of strings or as an empty object. Never throw on it.
 */
export const specsSchema = z.preprocess(
  (value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {}
    const out: Record<string, string> = {}
    for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
      if (raw === null || raw === undefined) continue
      out[key] = String(raw)
    }
    return out
  },
  z.record(z.string()),
)

export const gearSchema = z.object({
  _id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullish().transform((value) => value ?? ""),
  realPrice: z.number(),
  discountedPrice: z.number(),
  availableFor: z.array(z.enum(["rent", "sale"])).default(["rent"]),
  colors: z.array(z.string()).default([]),
  specs: specsSchema,
  image: imageUrlSchema.optional().default(""),
  category: categoryRefSchema,
  isNew: z.boolean().default(false),
  status: statusSchema.default("active"),
  ...timestamps,
})
export type Gear = z.infer<typeof gearSchema>

/* ------------------------------------------------------------------ */
/* Package                                                              */
/* ------------------------------------------------------------------ */

export const packageSchema = z.object({
  _id: z.string(),
  name: z.string(),
  slug: z.string(),
  price: z.number(),
  items: z.array(z.string()).default([]),
  description: z.string().nullish().transform((value) => value ?? ""),
  status: statusSchema.default("active"),
  ...timestamps,
})
export type Package = z.infer<typeof packageSchema>

/* ------------------------------------------------------------------ */
/* Destination                                                          */
/* ------------------------------------------------------------------ */

export const destinationSchema = z.object({
  _id: z.string(),
  name: z.string(),
  slug: z.string(),
  blurb: z.string().nullish().transform((value) => value ?? ""),
  image: imageUrlSchema.optional().default(""),
  status: statusSchema.default("active"),
  ...timestamps,
})
export type Destination = z.infer<typeof destinationSchema>

/* ------------------------------------------------------------------ */
/* Video                                                                */
/* ------------------------------------------------------------------ */

export const videoSchema = z.object({
  _id: z.string(),
  title: z.string(),
  category: z.string().default("All"),
  cloudinaryUrl: z.string(),
  publicId: z.string(),
  thumbnailUrl: z.string().nullish().transform((value) => value ?? ""),
  order: z.number().default(0),
  isFeatured: z.boolean().default(false),
  status: statusSchema.default("active"),
  ...timestamps,
})
export type Video = z.infer<typeof videoSchema>

/** Payload from POST /video/upload-signature. */
export const uploadSignatureSchema = z.object({
  cloudName: z.string(),
  apiKey: z.string(),
  timestamp: z.number(),
  folder: z.string(),
  signature: z.string(),
  uploadUrl: z.string().url(),
})
export type UploadSignature = z.infer<typeof uploadSignatureSchema>

/** What Cloudinary itself answers with (not our envelope). */
export const cloudinaryUploadSchema = z.object({
  secure_url: z.string().url(),
  public_id: z.string(),
  duration: z.number().optional(),
  format: z.string().optional(),
})
export type CloudinaryUpload = z.infer<typeof cloudinaryUploadSchema>

/* ------------------------------------------------------------------ */
/* Contact leads                                                        */
/* ------------------------------------------------------------------ */

export const leadStatusSchema = z.enum(["new", "read", "resolved"])
export type LeadStatus = z.infer<typeof leadStatusSchema>

export const contactSchema = z.object({
  _id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  subject: z.string(),
  message: z.string(),
  status: leadStatusSchema.default("new"),
  ...timestamps,
})
export type Contact = z.infer<typeof contactSchema>

/* ------------------------------------------------------------------ */
/* Subscriber                                                           */
/* ------------------------------------------------------------------ */

export const subscriberSchema = z.object({
  _id: z.string(),
  email: z.string(),
  source: z.string().nullish().transform((value) => value ?? ""),
  ...timestamps,
})
export type Subscriber = z.infer<typeof subscriberSchema>

/* ------------------------------------------------------------------ */
/* Envelope + errors                                                    */
/* ------------------------------------------------------------------ */

/** meta on every list endpoint: { page, limit, total } */
export const paginationMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
})
export type PaginationMeta = z.infer<typeof paginationMetaSchema>

/** Envelope: every backend response is { data, message, meta }. */
export const envelopeSchema = <T extends z.ZodTypeAny>(data: T) =>
  z.object({
    data,
    message: z.string(),
    meta: paginationMetaSchema.nullish(),
  })

/** Error body: { code, message, detail? } */
export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  detail: z.unknown().optional(),
})
export type ApiError = z.infer<typeof apiErrorSchema>
