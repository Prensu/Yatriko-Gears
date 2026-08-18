import { z } from "zod"
import { api } from "@/lib/api"
import { buildFormData } from "@/lib/formData"
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

/**
 * PATCH /auth/me — update your own profile.
 * Multipart, file field `image`; the photo is only sent when one was picked,
 * so saving the text fields never wipes an existing avatar.
 */
export async function updateProfile(values: ProfileFormValues, file: File | null): Promise<AdminUser> {
  const res = await api.patch(
    "/auth/me",
    adminUserSchema,
    buildFormData(
      {
        name: values.name,
        // undefined is skipped by buildFormData; "" would hit the phone regex
        phone: values.phone || undefined,
        address: values.address,
      },
      file,
    ),
  )
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
