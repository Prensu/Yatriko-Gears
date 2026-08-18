import { useEffect, useState, type FormEvent } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { createPackage, fetchPackageBySlug, updatePackage } from "@/api/package"
import { ApiRequestError, errorMessage, isCanceled } from "@/lib/api"
import { usePageMeta } from "@/hooks/usePageMeta"
import { useToast } from "@/context/ToastContext"
import { emptyPackageForm, packageFormSchema, validateForm, type PackageFormState } from "@/types/forms"
import PageHeader from "@/components/common/PageHeader"
import FormField from "@/components/form/FormField"
import SubmitButton from "@/components/form/SubmitButton"
import TagInput from "@/components/form/TagInput"
import type { Status } from "@/types"

/**
 * Packages are the one content module without an image: the backend route has
 * no multer middleware and PackageModel has no image field, so this form
 * submits plain JSON instead of multipart.
 */
export default function PackageFormPage() {
  const { slug } = useParams<{ slug: string }>()
  const isEdit = Boolean(slug)
  usePageMeta(isEdit ? "Edit package" : "New package")

  const navigate = useNavigate()
  const toast = useToast()

  const [form, setForm] = useState<PackageFormState>(emptyPackageForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(isEdit)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const set = <K extends keyof PackageFormState>(key: K, value: PackageFormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  useEffect(() => {
    if (!slug) return
    const controller = new AbortController()
    setLoading(true)
    setLoadError(null)

    fetchPackageBySlug(slug, controller.signal)
      .then((pkg) => {
        setForm({
          name: pkg.name,
          price: String(pkg.price),
          items: pkg.items,
          description: pkg.description,
          status: pkg.status,
        })
        setLoading(false)
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || isCanceled(error)) return
        setLoadError(errorMessage(error, "Could not load this package"))
        setLoading(false)
      })

    return () => controller.abort()
  }, [slug])

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()

    const parsed = validateForm(packageFormSchema, form)
    if (!parsed.ok) {
      setErrors(parsed.errors)
      toast.error("Please fix the highlighted fields")
      return
    }

    setErrors({})
    setSubmitting(true)
    try {
      if (slug) await updatePackage(slug, parsed.data)
      else await createPackage(parsed.data)

      toast.success(slug ? "Package updated successfully" : "Package created successfully")
      navigate("/packages")
    } catch (error) {
      toast.error(errorMessage(error, "Could not save this package"))
      if (error instanceof ApiRequestError) setErrors(error.fieldErrors)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-52" />
        <div className="card space-y-4 p-5">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="skeleton h-10" />
          ))}
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="card p-6 text-center">
        <p className="text-sm font-medium text-ink-900">{loadError}</p>
        <Link to="/packages" className="btn-secondary mt-4">
          Back to packages
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <PageHeader
        title={isEdit ? "Edit package" : "New package"}
        description="Combos are stored without an image — the public site renders them as a list."
        actions={
          <>
            <Link to="/packages" className="btn-secondary">
              Cancel
            </Link>
            <SubmitButton loading={submitting}>
              {isEdit ? "Save changes" : "Create package"}
            </SubmitButton>
          </>
        }
      />

      <section className="card max-w-3xl space-y-4 p-5">
        <FormField label="Name" htmlFor="name" required error={errors.name}>
          <input
            id="name"
            type="text"
            className={`input ${errors.name ? "input-error" : ""}`}
            value={form.name}
            onChange={(event) => set("name", event.target.value)}
            placeholder="Weekend Camping Combo"
          />
        </FormField>

        <FormField label="Price (Rs)" htmlFor="price" required error={errors.price}>
          <input
            id="price"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            className={`input sm:max-w-xs ${errors.price ? "input-error" : ""}`}
            value={form.price}
            onChange={(event) => set("price", event.target.value)}
            placeholder="2500"
          />
        </FormField>

        <FormField
          label="Items"
          htmlFor="items"
          required
          error={errors.items}
          hint="Press Enter or comma after each item."
        >
          <TagInput
            id="items"
            value={form.items}
            onChange={(value) => set("items", value)}
            placeholder="Tent (3 Person), Sleeping Bag…"
            invalid={Boolean(errors.items)}
          />
        </FormField>

        <FormField label="Description" htmlFor="description" error={errors.description}>
          <textarea
            id="description"
            rows={4}
            className={`input ${errors.description ? "input-error" : ""}`}
            value={form.description}
            onChange={(event) => set("description", event.target.value)}
            placeholder="Who is this combo for?"
          />
        </FormField>

        <FormField label="Status" htmlFor="status" error={errors.status}>
          <select
            id="status"
            className="input sm:max-w-xs"
            value={form.status}
            onChange={(event) => set("status", event.target.value as Status)}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </FormField>
      </section>

      <div className="mt-5 flex justify-end gap-2 lg:hidden">
        <Link to="/packages" className="btn-secondary">
          Cancel
        </Link>
        <SubmitButton loading={submitting}>{isEdit ? "Save changes" : "Create package"}</SubmitButton>
      </div>
    </form>
  )
}
