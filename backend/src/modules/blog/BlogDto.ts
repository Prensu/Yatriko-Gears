import { z } from "zod"

export const BlogCreateDTO = z.object({
  title: z.string().trim().min(2, "Title must have atleast 2 character").max(200),
  excerpt: z.string().trim().min(1, "Excerpt is required").max(300),
  content: z.string().min(1, "Content is required").max(100000),
  author: z.string().trim().max(120).optional().default("Yatriko Gears"),
  status: z.enum(["active", "inactive"]).default("active"),
  metaTitle: z.string().trim().max(200).optional().default(""),
  metaDescription: z.string().trim().max(300).optional().default(""),
  coverImageUrl: z.string().url().nullish().or(z.literal("")).optional(),
  coverImagePublicId: z.string().nullish().or(z.literal("")).optional(),
})

export const BlogUpdateDTO = BlogCreateDTO.partial()
