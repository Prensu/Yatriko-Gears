import * as SecureStore from "expo-secure-store"
import { userSchema, type User } from "@/types/auth"

/**
 * Tokens live in the OS keychain/keystore (expo-secure-store), never in
 * AsyncStorage. The access token is also cached in memory so the axios
 * interceptor does not hit the keychain on every request.
 */
const ACCESS_KEY = "yatriko.accessToken"
const REFRESH_KEY = "yatriko.refreshToken"
const USER_KEY = "yatriko.user"

let accessTokenCache: string | null = null
let refreshTokenCache: string | null = null

export function getAccessToken(): string | null {
  return accessTokenCache
}

export function getRefreshToken(): string | null {
  return refreshTokenCache
}

export async function saveTokens(accessToken: string, refreshToken: string): Promise<void> {
  accessTokenCache = accessToken
  refreshTokenCache = refreshToken
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_KEY, accessToken),
    SecureStore.setItemAsync(REFRESH_KEY, refreshToken),
  ])
}

export async function saveUser(user: User): Promise<void> {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user))
}

export type StoredSession = { hasTokens: boolean; user: User | null }

/** Call once on app start: fills the in-memory cache from secure storage. */
export async function loadSession(): Promise<StoredSession> {
  try {
    const [access, refresh, rawUser] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_KEY),
      SecureStore.getItemAsync(REFRESH_KEY),
      SecureStore.getItemAsync(USER_KEY),
    ])
    accessTokenCache = access
    refreshTokenCache = refresh

    let user: User | null = null
    if (rawUser) {
      try {
        const parsed = userSchema.safeParse(JSON.parse(rawUser))
        user = parsed.success ? parsed.data : null
      } catch {
        user = null
      }
    }
    return { hasTokens: Boolean(access || refresh), user }
  } catch {
    return { hasTokens: false, user: null }
  }
}

export async function clearSession(): Promise<void> {
  accessTokenCache = null
  refreshTokenCache = null
  await Promise.allSettled([
    SecureStore.deleteItemAsync(ACCESS_KEY),
    SecureStore.deleteItemAsync(REFRESH_KEY),
    SecureStore.deleteItemAsync(USER_KEY),
  ])
}
