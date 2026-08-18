import type { PaginationMeta } from "@/types"

type PaginationProps = {
  meta: PaginationMeta
  onPageChange: (page: number) => void
  disabled?: boolean
}

/** Build a compact page list: 1 … 4 5 6 … 12 */
function pageWindow(current: number, last: number): Array<number | "gap"> {
  if (last <= 7) return Array.from({ length: last }, (_, index) => index + 1)

  const pages = new Set<number>([1, last, current, current - 1, current + 1])
  const sorted = [...pages].filter((page) => page >= 1 && page <= last).sort((a, b) => a - b)

  const out: Array<number | "gap"> = []
  let previous = 0
  for (const page of sorted) {
    if (previous && page - previous > 1) out.push("gap")
    out.push(page)
    previous = page
  }
  return out
}

export default function Pagination({ meta, onPageChange, disabled = false }: PaginationProps) {
  const lastPage = Math.max(1, Math.ceil(meta.total / Math.max(meta.limit, 1)))
  const from = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1
  const to = Math.min(meta.page * meta.limit, meta.total)

  return (
    <div className="flex flex-col gap-3 border-t border-ink-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-ink-500">
        Showing <span className="font-medium text-ink-700">{from}</span>–
        <span className="font-medium text-ink-700">{to}</span> of{" "}
        <span className="font-medium text-ink-700">{meta.total}</span>
      </p>

      {lastPage > 1 ? (
        <nav className="flex items-center gap-1" aria-label="Pagination">
          <button
            type="button"
            className="btn-secondary btn-sm"
            onClick={() => onPageChange(meta.page - 1)}
            disabled={disabled || meta.page <= 1}
          >
            Prev
          </button>

          {pageWindow(meta.page, lastPage).map((page, index) =>
            page === "gap" ? (
              <span key={`gap-${index}`} className="px-1 text-xs text-ink-400">
                …
              </span>
            ) : (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                disabled={disabled}
                aria-current={page === meta.page ? "page" : undefined}
                className={
                  page === meta.page
                    ? "btn btn-sm bg-brand-600 text-white hover:bg-brand-700"
                    : "btn-secondary btn-sm"
                }
              >
                {page}
              </button>
            ),
          )}

          <button
            type="button"
            className="btn-secondary btn-sm"
            onClick={() => onPageChange(meta.page + 1)}
            disabled={disabled || meta.page >= lastPage}
          >
            Next
          </button>
        </nav>
      ) : null}
    </div>
  )
}
