import { z } from "zod"

/**
 * The CMS uploads the video file DIRECTLY to Cloudinary (signed upload),
 * then registers the result here. The API never receives the video bytes.
 */
export const VideoCreateDTO = z.object({
  title: z.string().min(2, "Title must have atleast 2 character").max(160),
  category: z.string().max(60).optional().default("All"),
  cloudinaryUrl: z.string().url("cloudinaryUrl must be a valid URL"),
  publicId: z.string().min(1, "publicId is compulsory"),
  thumbnailUrl: z.string().url().optional().or(z.literal("")).default(""),
  order: z.coerce.number().int().default(0),
  isFeatured: z.coerce.boolean().default(false),
  status: z.enum(["active", "inactive"]).default("active"),
})

export const VideoUpdateDTO = VideoCreateDTO.partial()
