import { z } from "zod"

/** Users as returned by /auth/login and /auth/me. */
export const userSchema = z.object({
  _id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.enum(["customer", "admin"]),
  phone: z.string().optional(),
  address: z
    .string()
    .nullish()
    .transform((value) => value ?? ""),
  /** Google profile photo (plain URL) — empty for password accounts. */
  avatarUrl: z
    .string()
    .nullish()
    .transform((value) => value ?? ""),
  provider: z.enum(["local", "google"]).optional().default("local"),
})
export type User = z.infer<typeof userSchema>

export const loginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: userSchema,
})
export type LoginResponse = z.infer<typeof loginResponseSchema>

const nepaliPhone = /^(\+977[- ]?)?9\d{9}$/

export const loginFormSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
})
export type LoginFormValues = z.infer<typeof loginFormSchema>

/** Mirrors the backend UserRegisterDTO — role is always forced to customer. */
export const registerFormSchema = z
  .object({
    name: z.string().trim().min(2, "Name must have atleast 2 character").max(50),
    email: z.string().email("Enter a valid email").max(200),
    phone: z.string().regex(nepaliPhone, "Enter a valid Nepali mobile number"),
    address: z.string().max(200).optional().default(""),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  })
export type RegisterFormValues = z.infer<typeof registerFormSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
})

export const resetPasswordSchema = z
  .object({
    resetToken: z.string().min(1, "Paste the token from your email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  })
