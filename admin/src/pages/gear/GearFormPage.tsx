import { useEffect, useState, type FormEvent } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { createGear, fetchGearBySlug, updateGear } from "@/api/gear"
import { fetchCategoryOptions } from "@/api/category"
import { ApiRequestError, errorMessage, isCanceled } from "@/lib/api"
import { usePageMeta } from "@/hooks/usePageMeta"
import { useToast } from "@/context/ToastContext"
import { emptyGearForm, gearFormSchema, validateForm, type GearFormState } from "@/types/forms"
import PageHeader from "@/components/common/PageHeader"
import FormField from "@/components/form/FormField"
import SubmitButton from "@/components/form/SubmitButton"
import TagInput from "@/components/form/TagInput"
import SpecsEditor from "@/components/form/SpecsEditor"
import ImageDropzone from "@/components/form/ImageDropzone"
import Toggle from "@/components/form/Toggle"
import CheckboxGroup from "@/components/form/CheckboxGroup"
import type { Category, Status } from "@/types"

export default function GearFormPage() {
  const { slug } = useParams<{ slug: string }>()
  const isEdit = Boolean(slug)
  usePageMeta(isEdit ? "Edit gear" : "New gear")

  const navigate = useNavigate()
  const toast = useToast()

  const [form, setForm] = useState<GearFormState>(emptyGearForm)
  const [file, setFile] = useState<File | null>(null)
  const [existingImage, setExistingImage] = useState("")
  const [categories, setCategories] = useState<Category[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(isEdit)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const set = <K extends keyof GearFormState>(key: K, value: GearFormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  useEffect(() => {
    const controller = new AbortController()
    fetchCategoryOptions(controller.signal)
      .then(setCategories)
      .catch((error: unknown) => {
        if (!isCanceled(error)) toast.error(errorMessage(error, "Could not load categories"))
      })
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!slug) return
    const controller = new AbortController()
    setLoading(true)
    setLoadError(null)

    fetchGearBySlug(slug, controller.signal)
      .then((gear) => {
        setForm({
          name: gear.name,
          description: gear.description,
          realPrice: String(gear.realPrice),
          discountedPrice: String(gear.discountedPrice),
          availableFor: gear.availableFor.length > 0 ? gear.availableFor : ["rent"],
          colors: gear.colors,
          specs: gear.specs,
          category: gear.category?._id ?? "",
          isNew: gear.isNew,
          status: gear.status,
        })
        setExistingImage(gear.image)
        setLoading(false)
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || isCanceled(error)) return
        setLoadError(errorMessage(error, "Could not load this gear item"))
        setLoading(false)
      })

    return () => controller.abort()
  }, [slug])

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()

    const parsed = validateForm(gearFormSchema, form)
    if (!parsed.ok) {
      setErrors(parsed.errors)
      toast.error("Please fix the highlighted fields")
      return
    }

    setErrors({})
    setSubmitting(true)
    try {
      if (slug) await updateGear(slug, parsed.data, file)
      else await createGear(parsed.data, file)

      toast.success(slug ? "Gear updated successfully" : "Gear created successfully")
      navigate("/gear")
    } catch (error) {
      toast.error(errorMessage(error, "Could not save this gear item"))
      if (error instanceof ApiRequestError) setErrors(error.fieldErrors)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-52" />
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="card space-y-4 p-5 lg:col-span-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="skeleton h-10" />
            ))}
          </div>
          <div className="card space-y-4 p-5">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="skeleton h-20" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="card p-6 text-center">
        <p className="text-sm font-medium text-ink-900">{loadError}</p>
        <Link to="/gear" className="btn-secondary mt-4">
          Back to gear
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <PageHeader
        title={isEdit ? "Edit gear" : "New gear"}
        description={
          isEdit
            ? "The slug stays fixed so existing links keep working."
            : "Add an item to the public rental catalogue."
        }
        actions={
          <>
            <Link to="/gear" className="btn-secondary">
              Cancel
            </Link>
            <SubmitButton loading={submitting}>
              {isEdit ? "Save changes" : "Create gear"}
            </SubmitButton>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <section className="card space-y-4 p-5">
            <FormField label="Name" htmlFor="name" required error={errors.name}>
              <input
                id="name"
                type="text"
                className={`input ${errors.name ? "input-error" : ""}`}
                value={form.name}
                onChange={(event) => set("name", event.target.value)}
                placeholder="Tent (3 Person)"
              />
            </FormField>

            <FormField label="Description" htmlFor="description" error={errors.description}>
              <textarea
                id="description"
                rows={4}
                className={`input ${errors.description ? "input-error" : ""}`}
                value={form.description}
                onChange={(event) => set("description", event.target.value)}
                placeholder="What makes this item worth renting?"
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Real price (Rs)" htmlFor="realPrice" required error={errors.realPrice}>
                <input
                  id="realPrice"
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  className={`input ${errors.realPrice ? "input-error" : ""}`}
                  value={form.realPrice}
                  onChange={(event) => set("realPrice", event.target.value)}
                  placeholder="800"
                />
              </FormField>

              <FormField
                label="Discounted price (Rs)"
                htmlFor="discountedPrice"
                required
                error={errors.discountedPrice}
              >
                <input
                  id="discountedPrice"
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  className={`input ${errors.discountedPrice ? "input-error" : ""}`}
                  value={form.discountedPrice}
                  onChange={(event) => set("discountedPrice", event.target.value)}
                  placeholder="650"
                />
              </FormField>
            </div>

            <FormField label="Available for" required error={errors.availableFor}>
              <CheckboxGroup
                name="availableFor"
                options={[
                  { value: "rent", label: "Rent" },
                  { value: "sale", label: "Sale" },
                ]}
                value={form.availableFor}
                onChange={(value) => set("availableFor", value as GearFormState["availableFor"])}
              />
            </FormField>

            <FormField
              label="Colors"
              htmlFor="colors"
              error={errors.colors}
              hint="Press Enter or comma after each color."
            >
              <TagInput
                id="colors"
                value={form.colors}
                onChange={(value) => set("colors", value)}
                placeholder="Orange, Blue…"
                invalid={Boolean(errors.colors)}
              />
            </FormField>

            <FormField label="Specs" error={errors.specs} hint="Key/value pairs shown on the detail page.">
              <SpecsEditor value={form.specs} onChange={(value) => set("specs", value)} />
            </FormField>
          </section>
        </div>

        <div className="space-y-5">
          <section className="card space-y-4 p-5">
            <h2 className="text-sm font-semibold text-ink-900">Image</h2>
            <ImageDropzone
              file={file}
              onFileChange={setFile}
              existingUrl={existingImage}
              onReject={(message) => toast.error(message)}
            />
          </section>

          <section className="card space-y-4 p-5">
            <h2 className="text-sm font-semibold text-ink-900">Organisation</h2>

            <FormField label="Category" htmlFor="category" error={errors.category}>
              <select
                id="category"
                className={`input ${errors.category ? "input-error" : ""}`}
                value={form.category}
                onChange={(event) => set("category", event.target.value)}
              >
                <option value="">No category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Status" htmlFor="status" error={errors.status}>
              <select
                id="status"
                className="input"
                value={form.status}
                onChange={(event) => set("status", event.target.value as Status)}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </FormField>

            <Toggle
              label="New arrival"
              description="Shows a “New” badge on the public site."
              checked={form.isNew}
              onChange={(checked) => set("isNew", checked)}
            />
          </section>
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-2 lg:hidden">
        <Link to="/gear" className="btn-secondary">
          Cancel
        </Link>
        <SubmitButton loading={submitting}>{isEdit ? "Save changes" : "Create gear"}</SubmitButton>
      </div>
    </form>
  )
}
