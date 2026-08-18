import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { fetchMe, login as loginRequest, logout as logoutRequest, storeSession } from "@/api/auth"
import { ApiRequestError } from "@/lib/api"
import { clearSession, getStoredUser, hasToken, onSessionExpired, setStoredUser } from "@/lib/session"
import { useToast } from "@/context/ToastContext"
import type { AdminUser } from "@/types/auth"

/** Thrown when a valid, non-admin account tries to sign in to the CMS. */
export class AccessDeniedError extends Error {
  constructor() {
    super("Access denied — this account is not an administrator.")
    this.name = "AccessDeniedError"
  }
}

type AuthStatus = "loading" | "authenticated" | "unauthenticated"

type AuthContextValue = {
  user: AdminUser | null
  status: AuthStatus
  signIn: (email: string, password: string) => Promise<AdminUser>
  signOut: () => Promise<void>
  reloadProfile: () => Promise<void>
  /** Push a freshly saved profile into the session + cache. */
  applyProfile: (user: AdminUser) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  // Start from the cached user so the shell paints instantly; /auth/me decides.
  const [user, setUser] = useState<AdminUser | null>(() => getStoredUser())
  const [status, setStatus] = useState<AuthStatus>(() => (hasToken() ? "loading" : "unauthenticated"))
  const toast = useToast()

  /** Re-validate the stored token on every app load (and after a refresh). */
  const validate = useCallback(async () => {
    if (!hasToken()) {
      setUser(null)
      setStatus("unauthenticated")
      return
    }

    try {
      const me = await fetchMe()
      if (me.role !== "admin") {
        clearSession()
        setUser(null)
        setStatus("unauthenticated")
        return
      }
      // /auth/me returns a trimmed user; keep the richer cached fields.
      const cached = getStoredUser()
      const merged = cached && cached._id === me._id ? { ...cached, ...me } : me
      setStoredUser(merged)
      setUser(merged)
      setStatus("authenticated")
    } catch (error) {
      // 401 already tried /auth/refresh-token once inside the api layer.
      clearSession()
      setUser(null)
      setStatus("unauthenticated")
      if (error instanceof ApiRequestError && error.status === 0) {
        toast.error(error.message)
      }
    }
  }, [toast])

  useEffect(() => {
    void validate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** The api layer shouts when a refresh attempt failed mid-session. */
  useEffect(
    () =>
      onSessionExpired(() => {
        setUser(null)
        setStatus("unauthenticated")
      }),
    [],
  )

  const signIn = useCallback(async (email: string, password: string) => {
    const session = await loginRequest(email, password)

    if (session.user.role !== "admin") {
      // Log the freshly created session straight back out, then wipe storage.
      storeSession(session)
      await logoutRequest().catch(() => clearSession())
      setUser(null)
      setStatus("unauthenticated")
      throw new AccessDeniedError()
    }

    storeSession(session)
    setUser(session.user)
    setStatus("authenticated")
    return session.user
  }, [])

  const signOut = useCallback(async () => {
    try {
      await logoutRequest()
    } finally {
      setUser(null)
      setStatus("unauthenticated")
    }
  }, [])

  const applyProfile = useCallback((updated: AdminUser) => {
    setStoredUser(updated)
    setUser(updated)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, signIn, signOut, reloadProfile: validate, applyProfile }),
    [user, status, signIn, signOut, validate, applyProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>")
  return context
}
