import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/context/ToastContext"
import { errorMessage } from "@/lib/api"
import ConfirmModal from "@/components/common/ConfirmModal"
import Avatar from "@/components/common/Avatar"

/** Where the "View public site" link points; overridable per environment. */
const PUBLIC_SITE_URL = import.meta.env.VITE_PUBLIC_SITE_URL?.trim() || "http://localhost:5173"

type TopbarProps = {
  onMenuClick: () => void
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const { user, signOut } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
      toast.success("Signed out")
      navigate("/login", { replace: true })
    } catch (error) {
      toast.error(errorMessage(error, "Could not sign out"))
    } finally {
      setSigningOut(false)
      setConfirmOpen(false)
    }
  }

  return (
    <>
      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-ink-200 bg-white/95 px-4 backdrop-blur sm:px-6">
        <button
          type="button"
          className="btn-ghost -ml-2 px-2 lg:hidden"
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
        </button>

        <a
          href={PUBLIC_SITE_URL}
          target="_blank"
          rel="noreferrer"
          className="hidden text-xs font-medium text-ink-500 transition hover:text-brand-700 sm:inline-flex sm:items-center sm:gap-1.5"
        >
          View public site
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 17 17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>

        <div className="ml-auto flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium leading-tight text-ink-900">{user?.name ?? "Admin"}</p>
            <p className="text-xs leading-tight text-ink-500">{user?.email ?? ""}</p>
          </div>

          <Avatar name={user?.name ?? "Admin"} src={user?.image} className="h-8 w-8" />

          <button
            type="button"
            className="btn-secondary btn-sm"
            onClick={() => setConfirmOpen(true)}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 17l5-5-5-5M20 12H9M12 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <ConfirmModal
        open={confirmOpen}
        title="Sign out?"
        message="You will need your admin credentials to get back in."
        confirmLabel="Sign out"
        danger={false}
        loading={signingOut}
        onConfirm={() => void handleSignOut()}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  )
}
