import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  clearSession,
  fetchMe,
  getStoredUser,
  hasToken,
  login as loginRequest,
  loginWithGoogle as googleRequest,
  logout as logoutRequest,
  storeSession,
} from "@/api/auth"
import type { User } from "@/types/auth"

type AuthStatus = "loading" | "authenticated" | "guest"

type AuthContextValue = {
  user: User | null
  status: AuthStatus
  signIn: (email: string, password: string) => Promise<User>
  signInWithGoogle: (credential: string) => Promise<User>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredUser())
  const [status, setStatus] = useState<AuthStatus>(() => (hasToken() ? "loading" : "guest"))

  // Re-validate the stored token once on load — it expires after an hour.
  useEffect(() => {
    // status already initialises to "guest" when there is no token, so there
    // is nothing to set here.
    if (!hasToken()) return
    fetchMe()
      .then((me) => {
        setUser(me)
        localStorage.setItem("yatriko.user", JSON.stringify(me))
        setStatus("authenticated")
      })
      .catch(() => {
        clearSession()
        setUser(null)
        setStatus("guest")
      })
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const session = await loginRequest(email, password)
    storeSession(session)
    setUser(session.user)
    setStatus("authenticated")
    return session.user
  }, [])

  const signInWithGoogle = useCallback(async (credential: string) => {
    const session = await googleRequest(credential)
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
      setStatus("guest")
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, signIn, signInWithGoogle, signOut }),
    [user, status, signIn, signInWithGoogle, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>")
  return context
}
