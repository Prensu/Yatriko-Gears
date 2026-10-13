import { z } from "zod"
import { api } from "@/lib/api"
import { clearSession, saveTokens, saveUser } from "@/lib/session"
import { loginResponseSchema, userSchema, type LoginResponse, type User } from "@/types/auth"

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post("/auth/login", loginResponseSchema, { email, password })
  return data
}

export async function register(input: {
  name: string
  email: string
  phone: string
  address?: string
  password: string
  confirmPassword: string
}): Promise<User> {
  const { data } = await api.post("/auth/register", userSchema, input)
  return data
}

/** POST /auth/google: exchange Google's ID token for our own session. */
export async function loginWithGoogle(credential: string): Promise<LoginResponse> {
  const { data } = await api.post("/auth/google", loginResponseSchema, { credential })
  return data
}

/** Always succeeds, even for unknown emails (the backend does not leak which exist). */
export async function requestPasswordReset(email: string): Promise<string> {
  const { message } = await api.post("/auth/forgot-password", z.null(), { email })
  return message
}

export async function resetPassword(input: {
  resetToken: string
  password: string
  confirmPassword: string
}): Promise<string> {
  const { message } = await api.post("/auth/reset-password", z.null(), input)
  return message
}

export async function fetchMe(): Promise<User> {
  const { data } = await api.get("/auth/me", userSchema)
  return data
}

export async function updateProfile(input: { name?: string; phone?: string; address?: string }): Promise<User> {
  await api.patch("/auth/me", z.unknown(), input)
  return fetchMe()
}

/** Revokes the server-side session (best effort), then wipes local credentials. */
export async function logout(): Promise<void> {
  try {
    await api.post("/auth/logout", z.null(), {})
  } catch {
    // Offline or already expired: we still sign out locally.
  } finally {
    await clearSession()
  }
}

export async function storeSession(session: LoginResponse): Promise<void> {
  await saveTokens(session.accessToken, session.refreshToken)
  await saveUser(session.user)
}
