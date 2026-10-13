import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
  fetchMe,
  login as loginRequest,
  loginWithGoogle as googleRequest,
  logout as logoutRequest,
  storeSession,
} from "@/api/auth"
import { ApiRequestError, setSessionExpiredHandler } from "@/lib/api"
import { googleSignOut } from "@/lib/googleSignIn"
import { loadSession, saveUser } from "@/lib/session"
import type { User } from "@/types/auth"

type AuthStatus = "loading" | "authenticated" | "guest"

type AuthContextValue = {
  user: User | null
  status: AuthStatus
  signIn: (email: string, password: string) => Promise<User>
  signInWithGoogle: (idToken: string) => Promise<User>
  signOut: () => Promise<void>
  /** Replace the cached user after a profile edit. */
  setUser: (user: User) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUserState] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthStatus>("loading")

  const toGuest = useCallback(() => {
    setUserState(null)
    setStatus("guest")
    queryClient.removeQueries({ queryKey: ["bookings"] })
  }, [queryClient])

  // A refresh token the server rejected means the session is over.
  useEffect(() => {
    setSessionExpiredHandler(toGuest)
    return () => setSessionExpiredHandler(null)
  }, [toGuest])

  // Restore the session from secure storage, then re-validate it once.
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const stored = await loadSession()
      if (cancelled) return
      if (!stored.hasTokens) {
        setStatus("guest")
        return
      }
      // Show the cached profile immediately so the UI is not empty while we check.
      if (stored.user) {
        setUserState(stored.user)
        setStatus("authenticated")
      }
      try {
        const me = await fetchMe()
        if (cancelled) return
        setUserState(me)
        setStatus("authenticated")
        await saveUser(me)
      } catch (error) {
        if (cancelled) return
        // Only a real 401 (after a failed silent refresh) ends the session. Being
        // offline or a cold-starting server must not sign anyone out.
        if (error instanceof ApiRequestError && error.status === 401) {
          toGuest()
        } else if (!stored.user) {
          setStatus("guest")
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [toGuest])

  const signIn = useCallback(async (email: string, password: string) => {
    const session = await loginRequest(email, password)
    await storeSession(session)
    setUserState(session.user)
    setStatus("authenticated")
    return session.user
  }, [])

  const signInWithGoogle = useCallback(async (idToken: string) => {
    const session = await googleRequest(idToken)
    await storeSession(session)
    setUserState(session.user)
    setStatus("authenticated")
    return session.user
  }, [])

  const signOut = useCallback(async () => {
    try {
      await logoutRequest()
      await googleSignOut()
    } finally {
      toGuest()
    }
  }, [toGuest])

  const setUser = useCallback((next: User) => {
    setUserState(next)
    void saveUser(next)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, signIn, signInWithGoogle, signOut, setUser }),
    [user, status, signIn, signInWithGoogle, signOut, setUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>")
  return context
}
