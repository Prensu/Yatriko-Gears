import { useEffect, useState, type FormEvent } from "react"
import { fetchSettings, updateSettings } from "@/api/settings"
import { useToast } from "@/context/ToastContext"
import { ApiRequestError, errorMessage, isCanceled } from "@/lib/api"
import { usePageMeta } from "@/hooks/usePageMeta"
import PageHeader from "@/components/common/PageHeader"
import FormField from "@/components/form/FormField"
import ImageDropzone from "@/components/form/ImageDropzone"
import Toggle from "@/components/form/Toggle"
import SubmitButton from "@/components/form/SubmitButton"

export default function PromotionsPage() {
  usePageMeta("Promotions")

  const toast = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [photo, setPhoto] = useState<File | null>(null)

  // Form state
  const [enabled, setEnabled] = useState(true)
  const [headline, setHeadline] = useState("Grand Opening Offer")
  const [body, setBody] = useState("")
  const [delayMs, setDelayMs] = useState("5000")
  const [cooldownDays, setCooldownDays] = useState("7")
  const [existingImage, setExistingImage] = useState("")

  // Load current settings
  useEffect(() => {
    const ctrl = new AbortController()
    fetchSettings(ctrl.signal)
      .then((s) => {
        setEnabled(s.leadModalEnabled)
        setHeadline(s.leadModalHeadline)
        setBody(s.leadModalBody)
        setDelayMs(String(s.leadModalShowDelayMs))
        setCooldownDays(String(s.leadModalCooldownDays))
        setExistingImage(s.leadModalImage)
      })
      .catch((err) => {
        if (!isCanceled(err)) toast.error(errorMessage(err, "Could not load settings"))
      })
      .finally(() => setLoading(false))
    return () => ctrl.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSave = async (event: FormEvent) => {
    event.preventDefault()

    const delayNum = Number(delayMs)
    const cooldownNum = Number(cooldownDays)

    const fieldErrors: Record<string, string> = {}
    if (!headline.trim()) fieldErrors.leadModalHeadline = "Headline is required"
    if (isNaN(delayNum) || delayNum < 0) fieldErrors.leadModalShowDelayMs = "Must be a non-negative number"
    if (isNaN(cooldownNum) || cooldownNum < 0)
      fieldErrors.leadModalCooldownDays = "Must be a non-negative number"

    if (Object.keys(fieldErrors).length) {
      setErrors(fieldErrors)
      toast.error("Please fix the highlighted fields")
      return
    }

    setErrors({})
    setSaving(true)
    try {
      const updated = await updateSettings(
        {
          leadModalEnabled: enabled,
          leadModalHeadline: headline.trim(),
          leadModalBody: body,
          leadModalShowDelayMs: delayNum,
          leadModalCooldownDays: cooldownNum,
        },
        photo,
      )
      setExistingImage(updated.leadModalImage)
      setPhoto(null)
      toast.success("Popup settings saved")
    } catch (error) {
      toast.error(errorMessage(error, "Could not save settings"))
      if (error instanceof ApiRequestError) setErrors(error.fieldErrors)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Promotions" description="Lead-capture popup configuration." />
        <div className="card flex items-center justify-center p-12 text-sm text-ink-500">
          Loading settings…
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Promotions"
        description="Control the lead-capture popup that visitors see on the public site."
      />

      <form onSubmit={handleSave} noValidate className="card p-5">
        <div className="border-b border-ink-200 pb-4">
          <Toggle
            checked={enabled}
            onChange={setEnabled}
            label="Show popup"
            description="When off, the popup never appears — no timer is set, no modal is rendered."
            disabled={saving}
          />
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-[minmax(0,14rem)_1fr]">
          <FormField label="Popup image" hint="The creative shown on the left panel.">
            <ImageDropzone
              file={photo}
              onFileChange={setPhoto}
              existingUrl={existingImage}
              onReject={(message) => toast.error(message)}
            />
          </FormField>

          <div className="space-y-4">
            <FormField
              label="Headline"
              htmlFor="leadModalHeadline"
              required
              error={errors.leadModalHeadline}
            >
              <input
                id="leadModalHeadline"
                type="text"
                className={`input ${errors.leadModalHeadline ? "input-error" : ""}`}
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Grand Opening Offer"
                disabled={saving}
              />
            </FormField>

            <FormField label="Body copy" htmlFor="leadModalBody" error={errors.leadModalBody}>
              <textarea
                id="leadModalBody"
                className={`input resize-none ${errors.leadModalBody ? "input-error" : ""}`}
                rows={3}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="e.g. on every rental gear — 21 to 31 Shrawan. Drop your email and claim the deal."
                disabled={saving}
              />
            </FormField>

            <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              <FormField
                label="Show delay (ms)"
                htmlFor="leadModalShowDelayMs"
                hint="Milliseconds before the popup appears."
                error={errors.leadModalShowDelayMs}
              >
                <input
                  id="leadModalShowDelayMs"
                  type="number"
                  min="0"
                  step="500"
                  className={`input ${errors.leadModalShowDelayMs ? "input-error" : ""}`}
                  value={delayMs}
                  onChange={(e) => setDelayMs(e.target.value)}
                  disabled={saving}
                />
              </FormField>

              <FormField
                label="Cooldown (days)"
                htmlFor="leadModalCooldownDays"
                hint="Days before the popup can reappear after dismissal."
                error={errors.leadModalCooldownDays}
              >
                <input
                  id="leadModalCooldownDays"
                  type="number"
                  min="0"
                  step="1"
                  className={`input ${errors.leadModalCooldownDays ? "input-error" : ""}`}
                  value={cooldownDays}
                  onChange={(e) => setCooldownDays(e.target.value)}
                  disabled={saving}
                />
              </FormField>
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end border-t border-ink-200 pt-4">
          <SubmitButton loading={saving}>Save popup settings</SubmitButton>
        </div>
      </form>
    </div>
  )
}
