import { z } from "zod"
import { parseMaybeJson } from "../../utilities/helpers"

/**
 * Multipart-friendly DTO: numbers arrive as strings (z.coerce) and
 * arrays/objects arrive as JSON strings (z.preprocess + parseMaybeJson).
 */
export const GearCreateDTO = z.object({
  name: z.string().min(2, "Name must have atleast 2 character").max(120),
  description: z.string().max(2000).optional().default(""),
  longDescription: z.string().max(50000).optional().default(""),
  realPrice: z.coerce.number().min(0),
  discountedPrice: z.coerce.number().min(0),
  availableFor: z.preprocess(parseMaybeJson, z.array(z.enum(["rent", "sale"])).default(["rent"])),
  colors: z.preprocess(parseMaybeJson, z.array(z.string()).default([])),
  specs: z.preprocess(parseMaybeJson, z.record(z.string()).default({})),
  category: z.preprocess(parseMaybeJson, z.string().nullable().optional()),
  quantityTotal: z.coerce.number().int().min(0, "Stock cannot be negative").default(1),
  isNew: z.coerce.boolean().default(false),
  status: z.enum(["active", "inactive"]).default("active"),
  imageUrl: z.string().url().nullish().or(z.literal("")).optional(),
  imagePublicId: z.string().nullish().or(z.literal("")).optional(),
  /** Array of Cloudinary-uploaded images: [{ imageUrl, imagePublicId }] */
  imagesData: z.preprocess(
    parseMaybeJson,
    z
      .array(
        z
          .object({
            imageUrl: z.string().min(1).optional(),
            url: z.string().min(1).optional(),
            imagePublicId: z.string().optional().default(""),
            publicId: z.string().optional().default(""),
          })
          .transform((item) => ({
            imageUrl: item.imageUrl ?? item.url ?? "",
            imagePublicId: item.imagePublicId ?? item.publicId ?? "",
          }))
          .refine((item) => item.imageUrl.length > 0, { message: "Image URL is required" }),
      )
      .max(10)
      .optional()
      .default([]),
  ),
})

export const GearUpdateDTO = GearCreateDTO.partial()
