type PaginationProps = {
  current: number
  total: number
  pageSize: number
  onChange: (page: number) => void
  showTotal?: boolean
}

function pageItems(current: number, pages: number): Array<number | "ellipsis-left" | "ellipsis-right"> {
  if (pages <= 7) return Array.from({ length: pages }, (_, index) => index + 1)
  const result: Array<number | "ellipsis-left" | "ellipsis-right"> = [1]
  if (current > 4) result.push("ellipsis-left")
  for (let page = Math.max(2, current - 2); page <= Math.min(pages - 1, current + 2); page += 1) result.push(page)
  if (current < pages - 3) result.push("ellipsis-right")
  result.push(pages)
  return result
}

export default function Pagination({ current, total, pageSize, onChange, showTotal = false }: PaginationProps) {
  const pages = Math.ceil(total / pageSize)
  if (pages <= 1) return null
  const go = (page: number) => onChange(Math.min(Math.max(page, 1), pages))

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-2 text-sm">
      {showTotal && <span className="mr-2 hidden text-slate-500 sm:inline">{total} items</span>}
      <button type="button" onClick={() => go(current - 1)} disabled={current === 1} className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-medium text-navy-800 transition hover:border-forest-300 hover:text-forest-700 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Previous page">Prev</button>
      <span className="px-2 text-slate-600 sm:hidden">Page {current} of {pages}</span>
      <div className="hidden items-center gap-1 sm:flex">
        {pageItems(current, pages).map((item) => item === "ellipsis-left" || item === "ellipsis-right" ? (
          <button key={item} type="button" onClick={() => go(item === "ellipsis-left" ? current - 5 : current + 5)} className="rounded-lg px-2 py-2 text-slate-500 hover:bg-forest-50 hover:text-forest-700" aria-label={item === "ellipsis-left" ? "Jump back five pages" : "Jump forward five pages"}>…</button>
        ) : (
          <button key={item} type="button" onClick={() => go(item)} aria-current={item === current ? "page" : undefined} aria-label={`Page ${item}`} className={`h-9 min-w-9 rounded-lg px-2 font-semibold transition ${item === current ? "bg-forest-600 text-white" : "text-navy-800 hover:bg-forest-50 hover:text-forest-700"}`}>{item}</button>
        ))}
      </div>
      <button type="button" onClick={() => go(current + 1)} disabled={current === pages} className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-medium text-navy-800 transition hover:border-forest-300 hover:text-forest-700 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Next page">Next</button>
    </nav>
  )
}
