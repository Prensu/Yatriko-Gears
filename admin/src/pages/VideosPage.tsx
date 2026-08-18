import { useRef, useState, type FormEvent } from "react"
import { createVideo, deleteVideo, fetchUploadSignature, fetchVideoList, uploadToCloudinary } from "@/api/video"
import { ApiRequestError, errorMessage } from "@/lib/api"
import { formatDate } from "@/lib/format"
import { usePageMeta } from "@/hooks/usePageMeta"
import { useListResource } from "@/hooks/useListResource"
import { useDeleteConfirm } from "@/hooks/useDeleteConfirm"
import { useToast } from "@/context/ToastContext"
import { validateForm, videoFormSchema } from "@/types/forms"
import PageHeader from "@/components/common/PageHeader"
import DataTable, { type Column } from "@/components/common/DataTable"
import StatusBadge from "@/components/common/StatusBadge"
import ConfirmModal from "@/components/common/ConfirmModal"
import FormField from "@/components/form/FormField"
import SubmitButton from "@/components/form/SubmitButton"
import type { Video } from "@/types"

const MAX_VIDEO_MB = 100

type Phase = "idle" | "signing" | "uploading" | "saving"

const PHASE_LABEL: Record<Phase, string> = {
  idle: "",
  signing: "Requesting a signed upload…",
  uploading: "Uploading to Cloudinary…",
  saving: "Saving the video record…",
}

export default function VideosPage() {
  usePageMeta("Videos")

  const toast = useToast()
  const list = useListResource<Video>(fetchVideoList, { limit: 10 })

  const [panelOpen, setPanelOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("All")
  const [file, setFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [phase, setPhase] = useState<Phase>("idle")
  const [progress, setProgress] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  const busy = phase !== "idle"

  const deletion = useDeleteConfirm({
    remove: deleteVideo,
    entity: "video",
    onDone: (deleted) => list.reloadAfterDelete(deleted),
  })

  const resetForm = () => {
    setTitle("")
    setCategory("All")
    setFile(null)
    setErrors({})
    setProgress(0)
    setPhase("idle")
  }

  /** Signature → direct Cloudinary upload → persist the record. */
  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()

    const parsed = validateForm(videoFormSchema, { title, category })
    if (!parsed.ok) {
      setErrors(parsed.errors)
      return
    }
    if (!file) {
      setErrors({ file: "Choose a video file to upload" })
      return
    }
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      setErrors({ file: `Video is larger than ${MAX_VIDEO_MB} MB` })
      return
    }

    setErrors({})
    const controller = new AbortController()
    abortRef.current = controller

    try {
      setPhase("signing")
      const signature = await fetchUploadSignature()

      setPhase("uploading")
      setProgress(0)
      const uploaded = await uploadToCloudinary(signature, file, setProgress, controller.signal)

      setPhase("saving")
      setProgress(100)
      await createVideo({
        title: parsed.data.title,
        category: parsed.data.category || "All",
        cloudinaryUrl: uploaded.secure_url,
        publicId: uploaded.public_id,
      })

      toast.success("Video added successfully")
      resetForm()
      setPanelOpen(false)
      list.reload()
    } catch (error) {
      if (controller.signal.aborted) {
        toast.info("Upload canceled")
      } else {
        toast.error(errorMessage(error, "Could not add this video"))
        if (error instanceof ApiRequestError) setErrors(error.fieldErrors)
      }
      setPhase("idle")
      setProgress(0)
    } finally {
      abortRef.current = null
    }
  }

  const columns: Column<Video>[] = [
    {
      key: "title",
      header: "Video",
      render: (video) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink-900">{video.title}</p>
          <a
            href={video.cloudinaryUrl}
            target="_blank"
            rel="noreferrer"
            className="truncate text-xs text-brand-700 hover:underline"
          >
            {video.publicId}
          </a>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      className: "hidden md:table-cell",
      render: (video) => <span className="text-ink-600">{video.category}</span>,
    },
    {
      key: "createdAt",
      header: "Added",
      className: "hidden lg:table-cell",
      render: (video) => <span className="whitespace-nowrap text-ink-500">{formatDate(video.createdAt)}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (video) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge value={video.status} />
          {video.isFeatured ? <StatusBadge value="featured" /> : null}
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-32 text-right",
      render: (video) => (
        <div className="flex justify-end gap-1">
          <a href={video.cloudinaryUrl} target="_blank" rel="noreferrer" className="btn-secondary btn-sm">
            Preview
          </a>
          <button
            type="button"
            className="btn-ghost btn-sm text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => deletion.request([video._id], video.title)}
          >
            Delete
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Videos"
        description="Portfolio clips hosted on Cloudinary — uploaded straight from your browser."
        actions={
          <button
            type="button"
            className={panelOpen ? "btn-secondary" : "btn-primary"}
            onClick={() => {
              if (busy) return
              setPanelOpen((open) => !open)
              setErrors({})
            }}
            disabled={busy}
          >
            {panelOpen ? "Close" : "Add video"}
          </button>
        }
      />

      {panelOpen ? (
        <form onSubmit={onSubmit} noValidate className="card mb-5 space-y-4 p-5">
          <h2 className="text-sm font-semibold text-ink-900">New video</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Title" htmlFor="title" required error={errors.title}>
              <input
                id="title"
                type="text"
                className={`input ${errors.title ? "input-error" : ""}`}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Champadevi overnight camp"
                disabled={busy}
              />
            </FormField>

            <FormField
              label="Category"
              htmlFor="category"
              error={errors.category}
              hint="Used by the portfolio filter — “All” shows everywhere."
            >
              <input
                id="category"
                type="text"
                className={`input ${errors.category ? "input-error" : ""}`}
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder="All"
                disabled={busy}
              />
            </FormField>
          </div>

          <FormField
            label="Video file"
            htmlFor="video-file"
            required
            error={errors.file}
            hint={`MP4, MOV or WebM · up to ${MAX_VIDEO_MB} MB. The file goes straight to Cloudinary.`}
          >
            <input
              id="video-file"
              type="file"
              accept="video/*"
              disabled={busy}
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="block w-full text-sm text-ink-600 file:mr-3 file:rounded-md file:border-0
                         file:bg-brand-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white
                         hover:file:bg-brand-700 disabled:opacity-60"
            />
          </FormField>

          {busy ? (
            <div className="rounded-lg border border-ink-200 bg-ink-50 p-3">
              <div className="mb-2 flex items-center justify-between text-xs font-medium text-ink-600">
                <span>{PHASE_LABEL[phase]}</span>
                {phase === "uploading" ? <span>{progress}%</span> : null}
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-ink-200">
                <div
                  className="h-full rounded-full bg-brand-600 transition-all duration-200"
                  style={{ width: `${phase === "uploading" ? progress : phase === "saving" ? 100 : 8}%` }}
                />
              </div>
            </div>
          ) : null}

          <div className="flex justify-end gap-2">
            {busy ? (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => abortRef.current?.abort()}
              >
                Cancel upload
              </button>
            ) : (
              <button type="button" className="btn-secondary" onClick={() => { resetForm(); setPanelOpen(false) }}>
                Cancel
              </button>
            )}
            <SubmitButton loading={busy}>{busy ? "Uploading…" : "Upload video"}</SubmitButton>
          </div>
        </form>
      ) : null}

      <DataTable
        columns={columns}
        rows={list.rows}
        rowKey={(video) => video._id}
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        filters={
          <select
            className="input w-auto min-w-[9rem]"
            value={list.filters.category ?? ""}
            onChange={(event) => list.setFilter("category", event.target.value)}
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {[...new Set(list.rows.map((video) => video.category))].map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        }
        meta={list.meta}
        onPageChange={list.setPage}
        emptyTitle="No videos yet"
        emptyMessage="Upload a clip to fill the portfolio page."
        emptyAction={
          <button type="button" className="btn-primary btn-sm" onClick={() => setPanelOpen(true)}>
            Add video
          </button>
        }
      />

      <p className="mt-3 text-xs text-ink-400">
        Deleting a video removes the database record <strong>and</strong> destroys the Cloudinary asset.
      </p>

      <ConfirmModal {...deletion.modalProps} />
    </div>
  )
}
