import { z } from "zod"

export const DestinationCreateDTO = z.object({
  name: z.string().min(2, "Name must have atleast 2 character").max(120),
  blurb: z.string().max(500).optional().default(""),
  status: z.enum(["active", "inactive"]).default("active"),
  imageUrl: z.string().url().nullish().or(z.literal("")).optional(),
  imagePublicId: z.string().nullish().or(z.literal("")).optional(),
})

export const DestinationUpdateDTO = DestinationCreateDTO.partial()
