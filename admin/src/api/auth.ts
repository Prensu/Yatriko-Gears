import { z } from "zod"
import { api } from "@/lib/api"
import { adminUserSchema, loginResponseSchema, type AdminUser, type LoginResponse } from "@/types/auth"
import { clearSession, setStoredUser, setTokens } from "@/lib/session"
import type { ProfileFormValues } from "@/types/forms"

/** POST /auth/login — returns { accessToken, refreshToken, user }. */
export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await api.post("/auth/login", loginResponseSchema, { email, password })
  return res.data
}

/** Persist a verified admin session. */
export function storeSession(session: LoginResponse): void {
  setTokens(session.accessToken, session.refreshToken)
  setStoredUser(session.user)
}

/** GET /auth/me — re-validates the session on every app load. */
export async function fetchMe(): Promise<AdminUser> {
  const res = await api.get("/auth/me", adminUserSchema)
  return res.data
}

export type UpdateProfileInput = ProfileFormValues & {
  imageUrl?: string
  imagePublicId?: string
}

/**
 * PATCH /auth/me — update your own profile (JSON).
 */
export async function updateProfile(input: UpdateProfileInput): Promise<AdminUser> {
  const res = await api.patch("/auth/me", adminUserSchema, {
    name: input.name,
    phone: input.phone || undefined,
    address: input.address,
    imageUrl: input.imageUrl,
    imagePublicId: input.imagePublicId,
  })
  return res.data
}

/** POST /auth/logout — revokes this session server-side, then wipes storage. */
export async function logout(): Promise<void> {
  try {
    await api.post("/auth/logout", z.null(), {})
  } finally {
    // Even if the call fails (expired token, offline) the local session goes.
    clearSession()
  }
}
