import { useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

/** Google photo when we have one, initials otherwise. */
export function Avatar({ size = "h-9 w-9", text = "text-sm" }: { size?: string; text?: string }) {
  const { user } = useAuth()

  if (user?.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.name}
        // Google blocks lh3.googleusercontent.com images when a referrer is
        // sent — without this the photo 403s and renders broken.
        referrerPolicy="no-referrer"
        className={`${size} shrink-0 rounded-full object-cover ring-2 ring-forest-100`}
      />
    )
  }

  return (
    <span
      className={`${size} ${text} flex shrink-0 items-center justify-center rounded-full bg-forest-600 font-display font-bold text-white`}
    >
      {initials(user?.name ?? "G")}
    </span>
  )
}

/**
 * Account dropdown, following the pattern Nepali storefronts use (Daraz,
 * Foodmandu, Pathao): avatar top-right, and a panel showing who you are
 * followed by orders and sign-out.
 */
export default function AccountMenu() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Close on outside click and on Escape.
  useEffect(() => {
    if (!open) return

    const onClick = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }

    document.addEventListener("mousedown", onClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  const handleSignOut = async () => {
    setOpen(false)
    await signOut()
    navigate("/")
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 transition hover:bg-forest-50"
      >
        <Avatar />
        <span className="hidden max-w-[7rem] truncate font-display text-sm font-semibold text-navy-800 lg:block">
          {user?.name?.split(" ")[0]}
        </span>
        <svg
          className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl"
        >
          <div className="flex items-center gap-3 border-b border-slate-100 bg-sand px-4 py-4">
            <Avatar size="h-12 w-12" text="text-base" />
            <div className="min-w-0">
              <p className="truncate font-display font-bold text-navy-900">{user?.name}</p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
              {user?.provider === "google" ? (
                <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                  <svg className="h-3 w-3" viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.1 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.7 9.5 24 9.5Z" />
                    <path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.2-.4-4.6H24v9.1h12.4c-.5 2.9-2.2 5.3-4.7 7l7.6 5.9c4.4-4.1 6.8-10.1 6.8-17.4Z" />
                    <path fill="#FBBC05" d="M10.4 28.7c-.5-1.4-.8-2.9-.8-4.7s.3-3.3.8-4.7l-7.8-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.6 10.8l7.8-6.1Z" />
                    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.8 2.3-8.3 2.3-6.3 0-11.7-3.7-13.6-9.9l-7.8 6.1C6.5 42.6 14.6 48 24 48Z" />
                  </svg>
                  Signed in with Google
                </span>
              ) : user?.phone ? (
                <p className="mt-0.5 truncate text-xs text-slate-400">{user.phone}</p>
              ) : null}
            </div>
          </div>

          <nav className="p-2">
            <Link
              to="/bookings"
              onClick={() => setOpen(false)}
              role="menuitem"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 font-display text-sm font-semibold text-navy-800 transition hover:bg-forest-50 hover:text-forest-700"
            >
              <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              My Bookings
            </Link>

            <Link
              to="/gear"
              onClick={() => setOpen(false)}
              role="menuitem"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 font-display text-sm font-semibold text-navy-800 transition hover:bg-forest-50 hover:text-forest-700"
            >
              <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 20h18L12 4 3 20Z" strokeLinejoin="round" />
              </svg>
              Rent more gear
            </Link>

            <button
              type="button"
              onClick={() => void handleSignOut()}
              role="menuitem"
              className="mt-1 flex w-full items-center gap-3 rounded-xl border-t border-slate-100 px-3 py-2.5 font-display text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M15 17l5-5-5-5M20 12H9M12 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Logout
            </button>
          </nav>
        </div>
      ) : null}
    </div>
  )
}
