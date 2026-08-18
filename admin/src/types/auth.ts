import { z } from "zod"
import { imageUrlSchema } from "@/types"

/** Users as returned by /auth/login (full document) and /auth/me (trimmed). */
export const adminUserSchema = z.object({
  _id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.enum(["admin", "customer"]),
  phone: z.string().optional(),
  address: z
    .string()
    .nullish()
    .transform((value) => value ?? ""),
  image: imageUrlSchema.optional().default(""),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})
export type AdminUser = z.infer<typeof adminUserSchema>

/** POST /auth/login → { accessToken, refreshToken, user } */
export const loginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: adminUserSchema,
})
export type LoginResponse = z.infer<typeof loginResponseSchema>

/** POST /auth/refresh-token → { accessToken, refreshToken } */
export const refreshResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
})

export const loginFormSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
})
export type LoginForm = z.infer<typeof loginFormSchema>
