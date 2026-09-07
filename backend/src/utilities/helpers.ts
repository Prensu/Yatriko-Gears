import slugify from "slugify"
import { appConfig } from "../config/AppConfig"
import cloudinary from "../config/cloudinaryConfig"
import { loggerFor } from "../config/logger"

const log = loggerFor("helpers")

export type StoredImage = {
  url: string
  path?: string
  filename?: string
  size?: number
  mimeType?: string
}

/** Normalize a multer file into the stored image sub-document (legacy). */
export function mapImage(image: Express.Multer.File, dir: string): StoredImage {
  return {
    url: appConfig.imagePath + dir + image.filename, // filename, NOT fieldname
    path: image.destination,
    filename: image.filename,
    size: image.size,
    mimeType: image.mimetype,
  }
}

/** Normalize a Cloudinary upload result into the stored image sub-document. */
export function mapCloudinaryImage(params: { url: string; publicId: string }): StoredImage {
  return {
    url: params.url,
    path: params.publicId,
    filename: params.publicId.split("/").pop() ?? params.publicId,
    size: undefined,
    mimeType: undefined,
  }
}

/**
 * Destroy an image asset on Cloudinary (non-critical).
 * Skips legacy local disk paths (starting with "." or "/").
 */
export async function destroyCloudinaryImage(publicId?: string): Promise<void> {
  if (!publicId) return
  if (publicId.startsWith(".") || publicId.startsWith("/") || publicId.startsWith("public/")) {
    return
  }
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" })
  } catch {
    log.error(`Cloudinary image asset could not be destroyed: ${publicId}`)
  }
}

/** Slug helper — lower, strict, trimmed. */
export function makeSlug(name: string): string {
  return slugify(name, { lower: true, strict: true, trim: true })
}

/** Uniform pagination inputs with a hard cap. */
export function getPagination(query: Record<string, unknown>) {
  const page = Math.max(Number(query.page ?? 1) || 1, 1)
  const limit = Math.min(Math.max(Number(query.limit ?? 10) || 10, 1), 100)
  const skip = (page - 1) * limit
  return { page, limit, skip }
}

/**
 * Multipart forms send arrays/objects as JSON strings and null as "null".
 * Normalize before Zod validation.
 */
export function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== "string") return value
  if (value === "null") return null
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}
