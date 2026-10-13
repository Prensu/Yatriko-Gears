import * as SecureStore from "expo-secure-store"
import { Platform } from "react-native"
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

const isWeb = Platform.OS === "web"

function webStorage(): Storage | null {
  return isWeb && typeof window !== "undefined" ? window.localStorage : null
}

async function setStored(key: string, value: string): Promise<void> {
  const storage = webStorage()
  if (storage) storage.setItem(key, value)
  else await SecureStore.setItemAsync(key, value)
}

async function getStored(key: string): Promise<string | null> {
  const storage = webStorage()
  return storage ? storage.getItem(key) : SecureStore.getItemAsync(key)
}

async function deleteStored(key: string): Promise<void> {
  const storage = webStorage()
  if (storage) storage.removeItem(key)
  else await SecureStore.deleteItemAsync(key)
}

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
    setStored(ACCESS_KEY, accessToken),
    setStored(REFRESH_KEY, refreshToken),
  ])
}

export async function saveUser(user: User): Promise<void> {
  await setStored(USER_KEY, JSON.stringify(user))
}

export type StoredSession = { hasTokens: boolean; user: User | null }

/** Call once on app start: fills the in-memory cache from secure storage. */
export async function loadSession(): Promise<StoredSession> {
  try {
    const [access, refresh, rawUser] = await Promise.all([
      getStored(ACCESS_KEY),
      getStored(REFRESH_KEY),
      getStored(USER_KEY),
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
    deleteStored(ACCESS_KEY),
    deleteStored(REFRESH_KEY),
    deleteStored(USER_KEY),
  ])
}
