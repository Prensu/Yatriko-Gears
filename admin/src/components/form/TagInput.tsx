import { useState, type KeyboardEvent } from "react"

type TagInputProps = {
  id?: string
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  invalid?: boolean
}

/**
 * Free-form list input (gear colors, package items).
 * Enter or comma commits a tag; Backspace on an empty box removes the last one.
 */
export default function TagInput({ id, value, onChange, placeholder, invalid = false }: TagInputProps) {
  const [draft, setDraft] = useState("")

  const commit = (raw: string) => {
    const tag = raw.trim().replace(/,$/, "").trim()
    if (!tag) return
    if (!value.includes(tag)) onChange([...value, tag])
    setDraft("")
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault()
      commit(draft)
      return
    }
    if (event.key === "Backspace" && draft === "" && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-1.5 rounded-md border bg-white p-1.5 shadow-sm transition
        focus-within:ring-2 ${
          invalid
            ? "border-red-400 focus-within:border-red-500 focus-within:ring-red-500/20"
            : "border-ink-200 focus-within:border-brand-500 focus-within:ring-brand-500/20"
        }`}
    >
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded bg-ink-100 py-1 pl-2 pr-1 text-xs font-medium text-ink-700"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(value.filter((entry) => entry !== tag))}
            className="rounded p-0.5 text-ink-400 transition hover:bg-ink-200 hover:text-ink-700"
            aria-label={`Remove ${tag}`}
          >
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </span>
      ))}

      <input
        id={id}
        type="text"
        className="min-w-[8rem] flex-1 border-0 bg-transparent px-1.5 py-1 text-sm outline-none placeholder:text-ink-400"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => commit(draft)}
        placeholder={value.length === 0 ? (placeholder ?? "Type and press Enter") : ""}
      />
    </div>
  )
}
