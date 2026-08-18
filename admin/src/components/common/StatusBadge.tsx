type StatusBadgeProps = {
  value: string
  className?: string
}

/** Color-coded pill for every status-ish column (active, new, resolved, role…). */
const TONES: Record<string, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  inactive: "border-ink-200 bg-ink-100 text-ink-600",
  new: "border-amber-200 bg-amber-50 text-amber-700",
  read: "border-sky-200 bg-sky-50 text-sky-700",
  resolved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  admin: "border-brand-200 bg-brand-50 text-brand-700",
  customer: "border-ink-200 bg-ink-100 text-ink-600",
  featured: "border-violet-200 bg-violet-50 text-violet-700",
}

const FALLBACK = "border-ink-200 bg-ink-100 text-ink-600"

export default function StatusBadge({ value, className = "" }: StatusBadgeProps) {
  const tone = TONES[value.toLowerCase()] ?? FALLBACK
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${tone} ${className}`}
    >
      {value}
    </span>
  )
}
