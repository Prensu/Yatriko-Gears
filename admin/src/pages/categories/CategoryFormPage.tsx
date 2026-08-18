import { useEffect, useState, type FormEvent } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { createCategory, fetchCategoryBySlug, updateCategory } from "@/api/category"
import { ApiRequestError, errorMessage, isCanceled } from "@/lib/api"
import { usePageMeta } from "@/hooks/usePageMeta"
import { useToast } from "@/context/ToastContext"
import { categoryFormSchema, emptyCategoryForm, validateForm, type CategoryFormState } from "@/types/forms"
import PageHeader from "@/components/common/PageHeader"
import FormField from "@/components/form/FormField"
import SubmitButton from "@/components/form/SubmitButton"
import ImageDropzone from "@/components/form/ImageDropzone"
import type { Status } from "@/types"

export default function CategoryFormPage() {
  const { slug } = useParams<{ slug: string }>()
  const isEdit = Boolean(slug)
  usePageMeta(isEdit ? "Edit category" : "New category")

  const navigate = useNavigate()
  const toast = useToast()

  const [form, setForm] = useState<CategoryFormState>(emptyCategoryForm)
  const [file, setFile] = useState<File | null>(null)
  const [existingImage, setExistingImage] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(isEdit)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const set = <K extends keyof CategoryFormState>(key: K, value: CategoryFormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  useEffect(() => {
    if (!slug) return
    const controller = new AbortController()
    setLoading(true)
    setLoadError(null)

    fetchCategoryBySlug(slug, controller.signal)
      .then((category) => {
        setForm({
          name: category.name,
          description: category.description,
          status: category.status,
        })
        setExistingImage(category.image)
        setLoading(false)
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || isCanceled(error)) return
        setLoadError(errorMessage(error, "Could not load this category"))
        setLoading(false)
      })

    return () => controller.abort()
  }, [slug])

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()

    const parsed = validateForm(categoryFormSchema, form)
    if (!parsed.ok) {
      setErrors(parsed.errors)
      toast.error("Please fix the highlighted fields")
      return
    }

    setErrors({})
    setSubmitting(true)
    try {
      if (slug) await updateCategory(slug, parsed.data, file)
      else await createCategory(parsed.data, file)

      toast.success(slug ? "Category updated successfully" : "Category created successfully")
      navigate("/categories")
    } catch (error) {
      toast.error(errorMessage(error, "Could not save this category"))
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
        <Link to="/categories" className="btn-secondary mt-4">
          Back to categories
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <PageHeader
        title={isEdit ? "Edit category" : "New category"}
        description="Categories group gear on the public site and in the CMS filters."
        actions={
          <>
            <Link to="/categories" className="btn-secondary">
              Cancel
            </Link>
            <SubmitButton loading={submitting}>
              {isEdit ? "Save changes" : "Create category"}
            </SubmitButton>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="card space-y-4 p-5 lg:col-span-2">
          <FormField label="Name" htmlFor="name" required error={errors.name}>
            <input
              id="name"
              type="text"
              className={`input ${errors.name ? "input-error" : ""}`}
              value={form.name}
              onChange={(event) => set("name", event.target.value)}
              placeholder="Tents & Shelter"
            />
          </FormField>

          <FormField label="Description" htmlFor="description" error={errors.description}>
            <textarea
              id="description"
              rows={4}
              className={`input ${errors.description ? "input-error" : ""}`}
              value={form.description}
              onChange={(event) => set("description", event.target.value)}
              placeholder="Short summary of what belongs in this category."
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

        <section className="card space-y-4 p-5">
          <h2 className="text-sm font-semibold text-ink-900">Image</h2>
          <ImageDropzone
            file={file}
            onFileChange={setFile}
            existingUrl={existingImage}
            onReject={(message) => toast.error(message)}
          />
        </section>
      </div>

      <div className="mt-5 flex justify-end gap-2 lg:hidden">
        <Link to="/categories" className="btn-secondary">
          Cancel
        </Link>
        <SubmitButton loading={submitting}>{isEdit ? "Save changes" : "Create category"}</SubmitButton>
      </div>
    </form>
  )
}
