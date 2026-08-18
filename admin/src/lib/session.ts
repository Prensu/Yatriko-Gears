import { adminUserSchema, type AdminUser } from "@/types/auth"

/**
 * Session storage for the CMS.
 *
 * Storage keys are deliberately namespaced away from the public site
 * ("yatriko.accessToken") so both apps can be open side by side without
 * one clobbering the other's session.
 *
 * The access token + cached user live in localStorage (survive a restart);
 * the refresh token lives in sessionStorage, so it dies with the tab.
 * AGENTS.md asks that refresh tokens not be added to localStorage — but the
 * "retry once via /auth/refresh-token on a mid-session 401" requirement needs
 * the token to survive a page reload, and sessionStorage is the narrower of
 * the two options.
 */
export const ACCESS_TOKEN_KEY = "yatriko.admin.accessToken"
export const REFRESH_TOKEN_KEY = "yatriko.admin.refreshToken"
export const USER_KEY = "yatriko.admin.user"

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return sessionStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setTokens(accessToken: string, refreshToken?: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  if (refreshToken) sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

export function setStoredUser(user: AdminUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

/** Cached user for instant first paint; always re-validated via /auth/me. */
export function getStoredUser(): AdminUser | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    const parsed = adminUserSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export function clearSession(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  sessionStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function hasToken(): boolean {
  return Boolean(getAccessToken())
}

/* --- "the session died" broadcast, so AuthContext can react from api.ts --- */

type SessionListener = () => void
const listeners = new Set<SessionListener>()

export function onSessionExpired(listener: SessionListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function notifySessionExpired(): void {
  listeners.forEach((listener) => listener())
}
