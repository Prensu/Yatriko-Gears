import { useEffect, useRef, useState } from "react"

/**
 * Google Sign-In (Google Identity Services).
 *
 * Google renders its own button into `divRef` and hands back an ID token,
 * which the caller posts to /auth/google for server-side verification.
 * Renders nothing at all when VITE_GOOGLE_CLIENT_ID is unset, so the login
 * page never shows a button that cannot work.
 */
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? ""
const SCRIPT_SRC = "https://accounts.google.com/gsi/client"

type GoogleCredentialResponse = { credential?: string }

type GoogleIdentity = {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string
        callback: (response: GoogleCredentialResponse) => void
      }) => void
      renderButton: (parent: HTMLElement, options: Record<string, string | number>) => void
    }
  }
}

declare global {
  interface Window {
    google?: GoogleIdentity
  }
}

/** One shared <script> tag, however many buttons mount. */
function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`)
    if (existing) {
      existing.addEventListener("load", () => resolve())
      existing.addEventListener("error", () => reject(new Error("script failed")))
      return
    }

    const script = document.createElement("script")
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("script failed"))
    document.head.appendChild(script)
  })
}

type Props = {
  onCredential: (credential: string) => void
  disabled?: boolean
}

export default function GoogleSignInButton({ onCredential, disabled = false }: Props) {
  const divRef = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)

  // Keep the latest callback without re-initialising Google on every render.
  const callbackRef = useRef(onCredential)
  callbackRef.current = onCredential

  useEffect(() => {
    if (!CLIENT_ID) return
    let cancelled = false

    loadGoogleScript()
      .then(() => {
        if (cancelled || !divRef.current || !window.google) return

        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (response) => {
            if (response.credential) callbackRef.current(response.credential)
          },
        })

        window.google.accounts.id.renderButton(divRef.current, {
          theme: "outline",
          size: "large",
          shape: "pill",
          text: "continue_with",
          logo_alignment: "center",
          width: 320,
          // Google localises this button to the visitor's browser language by
          // default, which left a lone Nepali string in an English UI. Drop
          // this line to go back to auto-localising.
          locale: "en",
        })
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })

    return () => {
      cancelled = true
    }
  }, [])

  // Unconfigured: show a placeholder while developing so it's obvious the
  // button exists and what's missing — but never ship it to real visitors.
  if (!CLIENT_ID) {
    if (!import.meta.env.DEV) return null
    return (
      <div className="flex flex-col items-center gap-3">
        <Divider />
        <div
          className="flex w-full max-w-[20rem] cursor-not-allowed items-center justify-center gap-3
                     rounded-full border border-dashed border-slate-300 bg-slate-50 px-5 py-2.5"
          title="Set VITE_GOOGLE_CLIENT_ID in frontend/.env to enable this"
        >
          <GoogleMark />
          <span className="font-display text-sm font-semibold text-slate-400">Continue with Google</span>
        </div>
        <p className="text-center text-[11px] leading-snug text-slate-400">
          Dev only: set <code className="rounded bg-slate-100 px-1">VITE_GOOGLE_CLIENT_ID</code> in
          <code className="ml-1 rounded bg-slate-100 px-1">frontend/.env</code> to switch this on.
        </p>
      </div>
    )
  }

  if (failed) {
    return (
      <p className="text-center text-xs text-slate-400">
        Google sign-in is unavailable right now — use your email and password.
      </p>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <Divider />
      {/* Google paints its own button in here. */}
      <div ref={divRef} className={disabled ? "pointer-events-none opacity-60" : ""} />
    </div>
  )
}

function Divider() {
  return (
    <div className="flex w-full items-center gap-3">
      <span className="h-px flex-1 bg-slate-200" />
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">or</span>
      <span className="h-px flex-1 bg-slate-200" />
    </div>
  )
}

/** Google's four-colour G, so the placeholder reads as the real thing. */
function GoogleMark() {
  return (
    <svg className="h-4 w-4 opacity-40" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.1 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.7 9.5 24 9.5Z" />
      <path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.2-.4-4.6H24v9.1h12.4c-.5 2.9-2.2 5.3-4.7 7l7.6 5.9c4.4-4.1 6.8-10.1 6.8-17.4Z" />
      <path fill="#FBBC05" d="M10.4 28.7c-.5-1.4-.8-2.9-.8-4.7s.3-3.3.8-4.7l-7.8-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.6 10.8l7.8-6.1Z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.8 2.3-8.3 2.3-6.3 0-11.7-3.7-13.6-9.9l-7.8 6.1C6.5 42.6 14.6 48 24 48Z" />
    </svg>
  )
}
