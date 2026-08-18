import { useEffect, useRef, useState, type DragEvent } from "react"

const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "svg", "webp"]
const MAX_SIZE_MB = 3 // kept in sync with the backend's multer limit

type ImageDropzoneProps = {
  file: File | null
  onFileChange: (file: File | null) => void
  /** URL of the already-stored image, shown until a new file is picked. */
  existingUrl?: string
  onReject?: (message: string) => void
  invalid?: boolean
}

/** Drag-and-drop (or click) image picker with a live preview. */
export default function ImageDropzone({
  file,
  onFileChange,
  existingUrl = "",
  onReject,
  invalid = false,
}: ImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>("")

  useEffect(() => {
    if (!file) {
      setPreviewUrl("")
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const accept = (candidate: File | undefined) => {
    if (!candidate) return

    const extension = candidate.name.split(".").pop()?.toLowerCase() ?? ""
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      onReject?.(`Unsupported format. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`)
      return
    }
    if (candidate.size > MAX_SIZE_MB * 1024 * 1024) {
      onReject?.(`Image is larger than ${MAX_SIZE_MB} MB`)
      return
    }

    onFileChange(candidate)
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    accept(event.dataTransfer.files?.[0])
  }

  const shownImage = previewUrl || existingUrl

  return (
    <div>
      <div
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            inputRef.current?.click()
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Upload image"
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center transition ${
          dragging
            ? "border-brand-500 bg-brand-50"
            : invalid
              ? "border-red-300 bg-red-50/40 hover:bg-red-50"
              : "border-ink-300 bg-ink-50/60 hover:border-brand-400 hover:bg-brand-50/40"
        }`}
      >
        {shownImage ? (
          <img
            src={shownImage}
            alt="Selected preview"
            className="h-32 w-full max-w-xs rounded-md object-cover shadow-sm"
          />
        ) : (
          <svg className="h-8 w-8 text-ink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M3 16.5V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
            <circle cx="8.5" cy="9" r="1.5" />
            <path d="m4 17 5.5-5.5 4 4L17 12l3 3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}

        <p className="text-sm text-ink-600">
          <span className="font-medium text-brand-700">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-ink-400">
          {ALLOWED_EXTENSIONS.join(", ").toUpperCase()} · up to {MAX_SIZE_MB} MB
        </p>

        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/jpeg,image/png,image/gif,image/svg+xml,image/webp"
          onChange={(event) => {
            accept(event.target.files?.[0])
            // Allow re-picking the same file after a removal.
            event.target.value = ""
          }}
        />
      </div>

      {file ? (
        <div className="mt-2 flex items-center justify-between gap-2 text-xs text-ink-500">
          <span className="truncate">
            {file.name} · {(file.size / 1024).toFixed(0)} KB
          </span>
          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={() => onFileChange(null)}
          >
            Remove
          </button>
        </div>
      ) : existingUrl ? (
        <p className="mt-2 text-xs text-ink-500">Current image — upload a new one to replace it.</p>
      ) : null}
    </div>
  )
}
