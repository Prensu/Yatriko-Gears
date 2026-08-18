import { Link } from "react-router-dom"

type KpiCardProps = {
  label: string
  value: number | null
  icon: string
  hint?: string
  to?: string
  loading?: boolean
}

/** Dashboard metric tile — totals come from each list endpoint's meta.total. */
export default function KpiCard({ label, value, icon, hint, to, loading = false }: KpiCardProps) {
  const body = (
    <div className="card h-full p-4 transition group-hover:border-brand-300 group-hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</p>

          {loading ? (
            <div className="skeleton mt-2 h-7 w-16" />
          ) : (
            <p className="mt-1 text-2xl font-semibold tracking-tight text-ink-950">
              {value === null ? "—" : value.toLocaleString("en-IN")}
            </p>
          )}

          {hint ? <p className="mt-1 text-xs text-ink-400">{hint}</p> : null}
        </div>

        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
            <path d={icon} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </div>
  )

  return to ? (
    <Link to={to} className="group block">
      {body}
    </Link>
  ) : (
    <div className="group">{body}</div>
  )
}
