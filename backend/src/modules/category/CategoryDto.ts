import { z } from "zod"

export const CategoryCreateDTO = z.object({
  name: z.string().min(2, "Name must have atleast 2 character").max(100),
  description: z.string().max(500).nullable().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
  imageUrl: z.string().url().nullish().or(z.literal("")).optional(),
  imagePublicId: z.string().nullish().or(z.literal("")).optional(),
})

export const CategoryUpdateDTO = CategoryCreateDTO.partial()
