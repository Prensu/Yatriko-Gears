import { z } from "zod"
import { api } from "@/lib/api"
import { loginResponseSchema, userSchema, type LoginResponse, type User } from "@/types/auth"

/**
 * Customer accounts. The access token lives at localStorage["yatriko.accessToken"]
 * (the CMS uses a different key so both can be open at once); passwords are
 * hashed with bcrypt on the backend and never stored here.
 */
export const TOKEN_KEY = "yatriko.accessToken"
export const USER_KEY = "yatriko.user"

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

/** POST /auth/google — exchange Google's ID token for our own session. */
export async function loginWithGoogle(credential: string): Promise<LoginResponse> {
  const { data } = await api.post("/auth/google", loginResponseSchema, { credential })
  return data
}

export async function fetchMe(): Promise<User> {
  const { data } = await api.get("/auth/me", userSchema)
  return data
}

export async function logout(): Promise<void> {
  try {
    await api.post("/auth/logout", z.null(), {})
  } finally {
    clearSession()
  }
}

export function storeSession(session: LoginResponse): void {
  localStorage.setItem(TOKEN_KEY, session.accessToken)
  localStorage.setItem(USER_KEY, JSON.stringify(session.user))
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    const parsed = userSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export function hasToken(): boolean {
  return Boolean(localStorage.getItem(TOKEN_KEY))
}
