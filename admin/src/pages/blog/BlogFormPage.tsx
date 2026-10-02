import { useEffect, useState, type FormEvent } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import ReactQuill from "react-quill"
import "react-quill/dist/quill.snow.css"
import { createBlog, fetchBlogBySlug, updateBlog } from "@/api/blog"
import { uploadImage } from "@/api/uploads"
import { ApiRequestError, errorMessage, isCanceled } from "@/lib/api"
import { usePageMeta } from "@/hooks/usePageMeta"
import { useToast } from "@/context/ToastContext"
import { blogFormSchema, emptyBlogForm, validateForm, type BlogFormState } from "@/types/forms"
import PageHeader from "@/components/common/PageHeader"
import FormField from "@/components/form/FormField"
import SubmitButton from "@/components/form/SubmitButton"
import ImageDropzone from "@/components/form/ImageDropzone"
import Toggle from "@/components/form/Toggle"

export default function BlogFormPage() {
  const { slug } = useParams<{ slug: string }>()
  const isEdit = Boolean(slug)
  usePageMeta(isEdit ? "Edit blog post" : "New blog post")

  const navigate = useNavigate()
  const toast = useToast()
  const [form, setForm] = useState<BlogFormState>(emptyBlogForm)
  const [currentSlug, setCurrentSlug] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [existingImage, setExistingImage] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(isEdit)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const set = <K extends keyof BlogFormState>(key: K, value: BlogFormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  useEffect(() => {
    if (!slug) return
    const controller = new AbortController()
    setLoading(true)
    setLoadError(null)

    fetchBlogBySlug(slug, controller.signal)
      .then((post) => {
        setCurrentSlug(post.slug)
        setForm({
          title: post.title,
          excerpt: post.excerpt,
          content: post.content,
          author: post.author,
          status: post.status,
          metaTitle: post.metaTitle,
          metaDescription: post.metaDescription,
        })
        setExistingImage(post.coverImage)
        setLoading(false)
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || isCanceled(error)) return
        setLoadError(errorMessage(error, "Could not load this blog post"))
        setLoading(false)
      })

    return () => controller.abort()
  }, [slug])

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const parsed = validateForm(blogFormSchema, form)
    if (!parsed.ok) {
      setErrors(parsed.errors)
      toast.error("Please fix the highlighted fields")
      return
    }

    setErrors({})
    setSubmitting(true)
    try {
      let coverImageUrl: string | undefined
      let coverImagePublicId: string | undefined
      if (file) {
        const uploaded = await uploadImage("blog", file)
        coverImageUrl = uploaded.imageUrl
        coverImagePublicId = uploaded.imagePublicId
      }

      const payload = { ...parsed.data, coverImageUrl, coverImagePublicId }
      if (slug) await updateBlog(slug, payload)
      else await createBlog(payload)

      toast.success(slug ? "Blog post updated successfully" : "Blog post created successfully")
      navigate("/blog")
    } catch (error) {
      toast.error(errorMessage(error, "Could not save this blog post"))
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
            {Array.from({ length: 6 }).map((_, index) => <div key={index} className="skeleton h-10" />)}
          </div>
          <div className="card space-y-4 p-5"><div className="skeleton h-40" /></div>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="card p-6 text-center">
        <p className="text-sm font-medium text-ink-900">{loadError}</p>
        <Link to="/blog" className="btn-secondary mt-4">Back to blog</Link>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <PageHeader
        title={isEdit ? "Edit blog post" : "New blog post"}
        description="Create a helpful article for campers and trekkers."
        actions={
          <>
            {isEdit && currentSlug ? (
              <a href={`/blog/${encodeURIComponent(currentSlug)}`} target="_blank" rel="noreferrer" className="btn-secondary">
                View live ↗
              </a>
            ) : null}
            <Link to="/blog" className="btn-secondary">Cancel</Link>
            <SubmitButton loading={submitting}>{isEdit ? "Save changes" : "Publish post"}</SubmitButton>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <section className="card space-y-4 p-5">
            <FormField label="Title" htmlFor="title" required error={errors.title}>
              <input
                id="title"
                type="text"
                className={`input ${errors.title ? "input-error" : ""}`}
                value={form.title}
                onChange={(event) => set("title", event.target.value)}
                placeholder="How to choose a tent for a Nepal camping trip"
              />
            </FormField>

            <FormField label="Slug" htmlFor="slug" hint="Generated from the title and kept stable after creation.">
              <input id="slug" type="text" className="input bg-ink-50 text-ink-500" value={currentSlug || "Generated when saved"} readOnly />
            </FormField>

            <FormField label="Excerpt" htmlFor="excerpt" required error={errors.excerpt} hint="Up to 300 characters. Used on cards and as the default meta description.">
              <textarea
                id="excerpt"
                rows={4}
                className={`input ${errors.excerpt ? "input-error" : ""}`}
                value={form.excerpt}
                onChange={(event) => set("excerpt", event.target.value)}
                placeholder="A short, useful summary of this camping guide."
              />
            </FormField>

            <FormField label="Content (Rich Text)" htmlFor="content" required error={errors.content}>
              <div className="bg-white [&_.ql-container]:min-h-[300px] [&_.ql-container]:text-sm [&_.ql-editor]:font-body [&_.ql-editor]:text-navy-900 [&_.ql-toolbar]:rounded-t-lg [&_.ql-container]:rounded-b-lg">
                <ReactQuill
                  theme="snow"
                  value={form.content}
                  onChange={(value) => set("content", value)}
                  placeholder="Write the full camping or trekking guide here."
                />
              </div>
            </FormField>
          </section>

          <section className="card space-y-4 p-5">
            <h2 className="text-sm font-semibold text-ink-900">Search metadata</h2>
            <p className="text-xs text-ink-500">Leave either field empty to use the title or excerpt automatically.</p>
            <FormField label="Meta title" htmlFor="metaTitle" error={errors.metaTitle}>
              <input
                id="metaTitle"
                type="text"
                className={`input ${errors.metaTitle ? "input-error" : ""}`}
                value={form.metaTitle}
                onChange={(event) => set("metaTitle", event.target.value)}
                placeholder="Defaults to the post title"
              />
            </FormField>
            <FormField label="Meta description" htmlFor="metaDescription" error={errors.metaDescription}>
              <textarea
                id="metaDescription"
                rows={3}
                className={`input ${errors.metaDescription ? "input-error" : ""}`}
                value={form.metaDescription}
                onChange={(event) => set("metaDescription", event.target.value)}
                placeholder="Defaults to the excerpt"
              />
            </FormField>
          </section>
        </div>

        <div className="space-y-5">
          <section className="card space-y-4 p-5">
            <h2 className="text-sm font-semibold text-ink-900">Cover image</h2>
            <ImageDropzone
              file={file}
              onFileChange={setFile}
              existingUrl={existingImage}
              onReject={(message) => toast.error(message)}
            />
          </section>

          <section className="card space-y-4 p-5">
            <h2 className="text-sm font-semibold text-ink-900">Publishing</h2>
            <FormField label="Author" htmlFor="author" error={errors.author}>
              <input
                id="author"
                type="text"
                className={`input ${errors.author ? "input-error" : ""}`}
                value={form.author}
                onChange={(event) => set("author", event.target.value)}
              />
            </FormField>
            <Toggle
              label="Published"
              description="Active posts appear on the public blog and sitemap."
              checked={form.status === "active"}
              onChange={(checked) => set("status", checked ? "active" : "inactive")}
            />
          </section>
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-2 lg:hidden">
        <Link to="/blog" className="btn-secondary">Cancel</Link>
        <SubmitButton loading={submitting}>{isEdit ? "Save changes" : "Publish post"}</SubmitButton>
      </div>
    </form>
  )
}
