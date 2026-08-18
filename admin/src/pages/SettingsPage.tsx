import { useEffect, useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { updateProfile } from "@/api/auth"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/context/ToastContext"
import { ApiRequestError, errorMessage } from "@/lib/api"
import { formatDate } from "@/lib/format"
import { ACCESS_TOKEN_KEY } from "@/lib/session"
import { usePageMeta } from "@/hooks/usePageMeta"
import { profileFormSchema, validateForm, type ProfileFormState } from "@/types/forms"
import PageHeader from "@/components/common/PageHeader"
import StatusBadge from "@/components/common/StatusBadge"
import ConfirmModal from "@/components/common/ConfirmModal"
import Avatar from "@/components/common/Avatar"
import FormField from "@/components/form/FormField"
import ImageDropzone from "@/components/form/ImageDropzone"
import SubmitButton from "@/components/form/SubmitButton"

const API_BASE = import.meta.env.VITE_API_BASE_URL?.trim() || "/api/v1 (Vite proxy → :9005)"

export default function SettingsPage() {
  usePageMeta("Settings")

  const { user, signOut, reloadProfile, applyProfile } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const [form, setForm] = useState<ProfileFormState>({ name: "", phone: "", address: "" })
  const [photo, setPhoto] = useState<File | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  // Hydrate once the session user is known (or changes after a save).
  useEffect(() => {
    if (!user) return
    setForm({ name: user.name, phone: user.phone ?? "", address: user.address })
  }, [user])

  const set = <K extends keyof ProfileFormState>(key: K, value: ProfileFormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  const handleSave = async (event: FormEvent) => {
    event.preventDefault()

    const parsed = validateForm(profileFormSchema, form)
    if (!parsed.ok) {
      setErrors(parsed.errors)
      toast.error("Please fix the highlighted fields")
      return
    }

    setErrors({})
    setSaving(true)
    try {
      const updated = await updateProfile(parsed.data, photo)
      applyProfile(updated)
      setPhoto(null)
      toast.success("Profile updated successfully")
    } catch (error) {
      toast.error(errorMessage(error, "Could not save your profile"))
      if (error instanceof ApiRequestError) setErrors(error.fieldErrors)
    } finally {
      setSaving(false)
    }
  }

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

  const handleReload = async () => {
    setRefreshing(true)
    try {
      await reloadProfile()
      toast.success("Profile refreshed")
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div>
      <PageHeader title="Settings" description="Your admin profile and this session." />

      <div className="grid gap-5 lg:grid-cols-3">
        <form onSubmit={handleSave} noValidate className="card p-5 lg:col-span-2">
          <div className="flex items-center gap-4 border-b border-ink-200 pb-4">
            <Avatar
              name={user?.name ?? "Admin"}
              src={user?.image}
              className="h-12 w-12"
              textClassName="text-base"
            />
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-ink-950">{user?.name ?? "Admin"}</p>
              <div className="mt-1 flex items-center gap-2">
                <StatusBadge value={user?.role ?? "admin"} />
                <span className="truncate text-xs text-ink-500">{user?.email}</span>
              </div>
            </div>
            <button
              type="button"
              className="btn-secondary btn-sm ml-auto"
              onClick={() => void handleReload()}
              disabled={refreshing || saving}
            >
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-[minmax(0,14rem)_1fr]">
            <FormField label="Profile photo" hint="Square images look best.">
              <ImageDropzone
                file={photo}
                onFileChange={setPhoto}
                existingUrl={user?.image ?? ""}
                onReject={(message) => toast.error(message)}
              />
            </FormField>

            <div className="space-y-4">
              <FormField label="Name" htmlFor="name" required error={errors.name}>
                <input
                  id="name"
                  type="text"
                  className={`input ${errors.name ? "input-error" : ""}`}
                  value={form.name}
                  onChange={(event) => set("name", event.target.value)}
                  disabled={saving}
                />
              </FormField>

              <FormField label="Phone" htmlFor="phone" required error={errors.phone}>
                <input
                  id="phone"
                  type="tel"
                  className={`input ${errors.phone ? "input-error" : ""}`}
                  value={form.phone}
                  onChange={(event) => set("phone", event.target.value)}
                  placeholder="9800000000"
                  disabled={saving}
                />
              </FormField>

              <FormField label="Address" htmlFor="address" error={errors.address}>
                <input
                  id="address"
                  type="text"
                  className={`input ${errors.address ? "input-error" : ""}`}
                  value={form.address}
                  onChange={(event) => set("address", event.target.value)}
                  placeholder="Gabu, Khokana, Lalitpur"
                  disabled={saving}
                />
              </FormField>

              <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Email</p>
                  <p className="mt-0.5 break-words text-sm text-ink-900">{user?.email ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Member since</p>
                  <p className="mt-0.5 text-sm text-ink-900">{formatDate(user?.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 border-t border-ink-200 pt-4">
            <p className="text-xs text-ink-500">
              Email and role are fixed. Password changes go through{" "}
              <code className="rounded bg-ink-100 px-1">/auth/forgot-password</code>.
            </p>
            <SubmitButton loading={saving}>Save profile</SubmitButton>
          </div>
        </form>

        <section className="card space-y-4 p-5">
          <div>
            <h2 className="text-sm font-semibold text-ink-900">Session</h2>
            <p className="mt-1 text-xs leading-relaxed text-ink-500">
              Access tokens last 1 hour and are refreshed automatically once before you are signed
              out. Signing out revokes this session on the server.
            </p>
          </div>

          <dl className="space-y-2 text-xs">
            <div className="flex items-start justify-between gap-3">
              <dt className="text-ink-500">API base</dt>
              <dd className="text-right font-mono text-[0.7rem] text-ink-800">{API_BASE}</dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="text-ink-500">Token key</dt>
              <dd className="text-right font-mono text-[0.7rem] text-ink-800">{ACCESS_TOKEN_KEY}</dd>
            </div>
          </dl>

          <SubmitButton
            type="button"
            className="btn-danger w-full"
            onClick={() => setConfirmOpen(true)}
            loading={signingOut}
          >
            Log out
          </SubmitButton>
        </section>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Log out?"
        message="This revokes the current session on the server. You will need your credentials to sign back in."
        confirmLabel="Log out"
        danger
        loading={signingOut}
        onConfirm={() => void handleSignOut()}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
