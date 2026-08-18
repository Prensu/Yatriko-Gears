import { z } from "zod"

/** Self-registration can NEVER assign the admin role. */
export const UserRegisterDTO = z.object({
  name: z.string().min(2, "Name must have atleast 2 character").max(50),
  email: z.string().email("Enter a valid email").max(200),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Confirm-password is compulsory"),
  phone: z.string().regex(/^(\+977[- ]?)?9\d{9}$/, "Enter a valid Nepali mobile number"),
  role: z
    .string()
    .regex(/^(customer)$/, "Role must be customer")
    .default("customer"),
  address: z.string().max(200).nullable().optional(),
}).refine((v) => v.password === v.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match",
})
export type UserRegisterDTOType = z.infer<typeof UserRegisterDTO>

export const UserLoginDTO = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is compulsory"),
})
export type UserLoginDTOType = z.infer<typeof UserLoginDTO>

export const RefreshTokenDTO = z.object({
  refreshToken: z.string().min(1, "Refresh token is compulsory"),
})

export const ForgotPasswordDTO = z.object({
  email: z.string().email("Enter a valid email"),
})

export const ResetPasswordDTO = z.object({
  resetToken: z.string().min(1, "Reset token is compulsory"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Confirm-password is compulsory"),
}).refine((v) => v.password === v.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match",
})
