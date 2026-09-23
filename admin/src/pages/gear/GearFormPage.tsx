import { useEffect, useState, type FormEvent, type DragEvent } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { createGear, fetchGearBySlug, updateGear } from "@/api/gear"
import { uploadImage } from "@/api/uploads"
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
import Toggle from "@/components/form/Toggle"
import CheckboxGroup from "@/components/form/CheckboxGroup"
import type { Category, Status } from "@/types"
import ReactQuill from "react-quill"
import "react-quill/dist/quill.snow.css"

/* ------------------------------------------------------------------ */
/* Multi-image manager                                                  */
/* ------------------------------------------------------------------ */

type ExistingImage = { url: string; publicId: string }

const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "svg", "webp"]
const MAX_SIZE_MB = 3

function MultiImageManager({
  existingImages,
  onExistingChange,
  newFiles,
  onNewFilesChange,
  onReject,
}: {
  existingImages: ExistingImage[]
  onExistingChange: (images: ExistingImage[]) => void
  newFiles: File[]
  onNewFilesChange: (files: File[]) => void
  onReject: (message: string) => void
}) {
  const [dragging, setDragging] = useState(false)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [dragSourceIndex, setDragSourceIndex] = useState<number | null>(null)
  const [previewUrls, setPreviewUrls] = useState<Map<File, string>>(new Map())

  // Generate preview URLs for new files
  useEffect(() => {
    const urls = new Map<File, string>()
    for (const file of newFiles) {
      urls.set(file, URL.createObjectURL(file))
    }
    setPreviewUrls(urls)
    return () => {
      for (const url of urls.values()) URL.revokeObjectURL(url)
    }
  }, [newFiles])

  const totalCount = existingImages.length + newFiles.length

  const validateFile = (file: File): boolean => {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      onReject(`Unsupported format: ${file.name}. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`)
      return false
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      onReject(`${file.name} is larger than ${MAX_SIZE_MB} MB`)
      return false
    }
    return true
  }

  const addFiles = (fileList: FileList | null) => {
    if (!fileList) return
    const accepted: File[] = []
    for (const file of Array.from(fileList)) {
      if (totalCount + accepted.length >= 10) {
        onReject("Maximum 10 images allowed")
        break
      }
      if (validateFile(file)) accepted.push(file)
    }
    if (accepted.length > 0) onNewFilesChange([...newFiles, ...accepted])
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }

  const removeExisting = (index: number) => {
    onExistingChange(existingImages.filter((_, i) => i !== index))
  }

  const removeNew = (index: number) => {
    onNewFilesChange(newFiles.filter((_, i) => i !== index))
  }

  // Drag-to-reorder existing images
  const handleDragStart = (index: number) => setDragSourceIndex(index)
  const handleDragOver = (e: DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }
  const handleDragEnd = () => {
    if (dragSourceIndex !== null && dragOverIndex !== null && dragSourceIndex !== dragOverIndex) {
      const reordered = [...existingImages]
      const [moved] = reordered.splice(dragSourceIndex, 1)
      reordered.splice(dragOverIndex, 0, moved)
      onExistingChange(reordered)
    }
    setDragSourceIndex(null)
    setDragOverIndex(null)
  }

  return (
    <div className="space-y-3">
      {/* Existing images grid */}
      {existingImages.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {existingImages.map((img, idx) => (
            <div
              key={`${img.publicId || img.url}-${idx}`}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              className={`group relative cursor-grab overflow-hidden rounded-lg border-2 transition-all ${
                dragOverIndex === idx
                  ? "border-brand-500 bg-brand-50"
                  : idx === 0
                    ? "border-brand-400 ring-1 ring-brand-200"
                    : "border-ink-200"
              }`}
            >
              <img src={img.url} alt="" className="aspect-square w-full object-cover" />
              {idx === 0 && (
                <span className="absolute left-1.5 top-1.5 rounded bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
                  Primary
                </span>
              )}
              <button
                type="button"
                onClick={() => removeExisting(idx)}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-600/90 text-white opacity-0 shadow transition-opacity group-hover:opacity-100"
                aria-label={`Remove image ${idx + 1}`}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="absolute bottom-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded bg-black/40 text-[10px] text-white opacity-0 group-hover:opacity-100">
                ⠿
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New files pending upload */}
      {newFiles.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {newFiles.map((file, idx) => (
            <div
              key={`new-${idx}-${file.name}`}
              className="group relative overflow-hidden rounded-lg border-2 border-dashed border-emerald-300 bg-emerald-50/30"
            >
              <img
                src={previewUrls.get(file) ?? ""}
                alt={file.name}
                className="aspect-square w-full object-cover opacity-80"
              />
              <span className="absolute left-1.5 top-1.5 rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
                New
              </span>
              <button
                type="button"
                onClick={() => removeNew(idx)}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-600/90 text-white opacity-0 shadow transition-opacity group-hover:opacity-100"
                aria-label={`Remove new image ${file.name}`}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Dropzone / add button */}
      {totalCount < 10 && (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => {
            const input = document.createElement("input")
            input.type = "file"
            input.accept = "image/jpeg,image/png,image/gif,image/svg+xml,image/webp"
            input.multiple = true
            input.onchange = () => addFiles(input.files)
            input.click()
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              const input = document.createElement("input")
              input.type = "file"
              input.accept = "image/jpeg,image/png,image/gif,image/svg+xml,image/webp"
              input.multiple = true
              input.onchange = () => addFiles(input.files)
              input.click()
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Upload images"
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center transition ${
            dragging
              ? "border-brand-500 bg-brand-50"
              : "border-ink-300 bg-ink-50/60 hover:border-brand-400 hover:bg-brand-50/40"
          }`}
        >
          <svg className="h-8 w-8 text-ink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M3 16.5V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
            <circle cx="8.5" cy="9" r="1.5" />
            <path d="m4 17 5.5-5.5 4 4L17 12l3 3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-sm text-ink-600">
            <span className="font-medium text-brand-700">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-ink-400">
            {ALLOWED_EXTENSIONS.join(", ").toUpperCase()} · up to {MAX_SIZE_MB} MB · {totalCount}/10 images
          </p>
        </div>
      )}

      {existingImages.length > 1 && (
        <p className="text-xs text-ink-500">
          Drag images to reorder. The first image is the primary thumbnail shown on cards.
        </p>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

export default function GearFormPage() {
  const { slug } = useParams<{ slug: string }>()
  const isEdit = Boolean(slug)
  usePageMeta(isEdit ? "Edit gear" : "New gear")

  const navigate = useNavigate()
  const toast = useToast()

  const [form, setForm] = useState<GearFormState>(emptyGearForm)
  const [newFiles, setNewFiles] = useState<File[]>([])
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
          longDescription: gear.longDescription ?? "",
          realPrice: String(gear.realPrice),
          discountedPrice: String(gear.discountedPrice),
          availableFor: gear.availableFor.length > 0 ? gear.availableFor : ["rent"],
          colors: gear.colors,
          specs: gear.specs,
          category: gear.category?._id ?? "",
          quantityTotal: String(gear.quantityTotal ?? 1),
          isNew: gear.isNew,
          status: gear.status,
          existingImages:
            gear.imagesRaw && gear.imagesRaw.length > 0
              ? gear.imagesRaw
              : gear.image
                ? [{ url: gear.image, publicId: "" }]
                : [],
        })
        setNewFiles([])
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
      // Upload all new files to Cloudinary
      const uploadedNew: Array<{ imageUrl: string; imagePublicId: string }> = []
      for (const file of newFiles) {
        const uploaded = await uploadImage("gear", file)
        uploadedNew.push(uploaded)
      }

      // Build the combined imagesData array: existing (retained) + new uploads.
      const imagesData = [
        ...form.existingImages.map((img) => ({
          imageUrl: img.url,
          imagePublicId: img.publicId,
        })),
        ...uploadedNew,
      ]

      const payload = {
        ...parsed.data,
        imagesData: imagesData.length > 0 ? imagesData : undefined,
      }

      if (slug) await updateGear(slug, payload)
      else await createGear(payload)

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
            {isEdit && slug ? (
              <a
                href={`/gear/${encodeURIComponent(slug)}`}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
              >
                View live ↗
              </a>
            ) : null}
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
                rows={2}
                className={`input ${errors.description ? "input-error" : ""}`}
                value={form.description}
                onChange={(event) => set("description", event.target.value)}
                placeholder="Short description for gear cards"
              />
            </FormField>

            <FormField label="Long Description (Rich Text)" htmlFor="longDescription" error={errors.longDescription}>
              <div className="bg-white [&_.ql-container]:min-h-[200px] [&_.ql-container]:text-sm [&_.ql-editor]:font-body [&_.ql-editor]:text-navy-900 [&_.ql-toolbar]:rounded-t-lg [&_.ql-container]:rounded-b-lg">
                <ReactQuill
                  theme="snow"
                  value={form.longDescription}
                  onChange={(value) => set("longDescription", value)}
                  placeholder="Full product details, features, etc."
                />
              </div>
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
            <h2 className="text-sm font-semibold text-ink-900">Images</h2>
            <MultiImageManager
              existingImages={form.existingImages}
              onExistingChange={(images) => set("existingImages", images)}
              newFiles={newFiles}
              onNewFilesChange={setNewFiles}
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

            <FormField
              label="Units in stock"
              htmlFor="quantityTotal"
              required
              error={errors.quantityTotal}
              hint="How many you own. Bookings that would exceed this are refused."
            >
              <input
                id="quantityTotal"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                className={`input ${errors.quantityTotal ? "input-error" : ""}`}
                value={form.quantityTotal}
                onChange={(event) => set("quantityTotal", event.target.value)}
              />
            </FormField>

            <Toggle
              label="New arrival"
              description={'Shows a "New" badge on the public site.'}
              checked={form.isNew}
              onChange={(checked) => set("isNew", checked)}
            />
          </section>
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-2 lg:hidden">
        {isEdit && slug ? (
          <a
            href={`/gear/${encodeURIComponent(slug)}`}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary"
          >
            View live ↗
          </a>
        ) : null}
        <Link to="/gear" className="btn-secondary">
          Cancel
        </Link>
        <SubmitButton loading={submitting}>{isEdit ? "Save changes" : "Create gear"}</SubmitButton>
      </div>
    </form>
  )
}
