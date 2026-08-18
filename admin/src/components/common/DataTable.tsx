import { useEffect, useRef, type ReactNode } from "react"
import EmptyState from "@/components/common/EmptyState"
import Pagination from "@/components/common/Pagination"
import type { PaginationMeta } from "@/types"

export type Column<T> = {
  key: string
  header: string
  /** Extra classes for the <th>/<td> pair (width, alignment, hide-on-mobile). */
  className?: string
  render: (row: T) => ReactNode
}

type DataTableProps<T> = {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  loading?: boolean
  error?: string | null
  onRetry?: () => void

  /** Server-side search box. */
  search?: {
    value: string
    onChange: (value: string) => void
    placeholder?: string
  }
  /** Filter controls (selects) rendered next to the search box. */
  filters?: ReactNode
  /** Buttons on the right of the toolbar (e.g. "Export CSV"). */
  toolbarActions?: ReactNode

  selectable?: boolean
  selectedIds?: string[]
  onSelectionChange?: (ids: string[]) => void
  /** Bar shown above the table while rows are selected. */
  bulkActions?: (ids: string[]) => ReactNode

  meta?: PaginationMeta | null
  onPageChange?: (page: number) => void

  emptyTitle?: string
  emptyMessage?: string
  emptyAction?: ReactNode
}

function SkeletonRows({ columns, selectable }: { columns: number; selectable: boolean }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, rowIndex) => (
        <tr key={rowIndex} className="border-t border-ink-100">
          {selectable ? (
            <td className="table-cell w-10">
              <div className="skeleton h-4 w-4" />
            </td>
          ) : null}
          {Array.from({ length: columns }).map((__, cellIndex) => (
            <td key={cellIndex} className="table-cell">
              <div className="skeleton h-4" style={{ width: `${55 + ((cellIndex * 17) % 40)}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  error = null,
  onRetry,
  search,
  filters,
  toolbarActions,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  bulkActions,
  meta,
  onPageChange,
  emptyTitle = "Nothing here yet",
  emptyMessage,
  emptyAction,
}: DataTableProps<T>) {
  const selectAllRef = useRef<HTMLInputElement>(null)

  const pageIds = rows.map(rowKey)
  const selectedOnPage = pageIds.filter((id) => selectedIds.includes(id))
  const allSelected = pageIds.length > 0 && selectedOnPage.length === pageIds.length

  // "Some but not all" needs the indeterminate DOM property.
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = selectedOnPage.length > 0 && !allSelected
    }
  }, [selectedOnPage.length, allSelected])

  const toggleAll = () => {
    if (!onSelectionChange) return
    if (allSelected) onSelectionChange(selectedIds.filter((id) => !pageIds.includes(id)))
    else onSelectionChange([...new Set([...selectedIds, ...pageIds])])
  }

  const toggleRow = (id: string) => {
    if (!onSelectionChange) return
    if (selectedIds.includes(id)) onSelectionChange(selectedIds.filter((selected) => selected !== id))
    else onSelectionChange([...selectedIds, id])
  }

  const showToolbar = Boolean(search || filters || toolbarActions)

  return (
    <div className="card overflow-hidden">
      {showToolbar ? (
        <div className="flex flex-col gap-3 border-b border-ink-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            {search ? (
              <div className="relative sm:max-w-xs sm:flex-1">
                <svg
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" strokeLinecap="round" />
                </svg>
                <input
                  type="search"
                  className="input pl-9"
                  value={search.value}
                  onChange={(event) => search.onChange(event.target.value)}
                  placeholder={search.placeholder ?? "Search…"}
                  aria-label={search.placeholder ?? "Search"}
                />
              </div>
            ) : null}
            {filters ? <div className="flex flex-wrap items-center gap-2">{filters}</div> : null}
          </div>

          {toolbarActions ? <div className="flex flex-wrap gap-2">{toolbarActions}</div> : null}
        </div>
      ) : null}

      {selectable && selectedIds.length > 0 && bulkActions ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-200 bg-brand-50 px-4 py-2.5">
          <p className="text-sm font-medium text-brand-800">
            {selectedIds.length} selected
          </p>
          <div className="flex flex-wrap gap-2">{bulkActions(selectedIds)}</div>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] border-collapse">
          <thead className="bg-ink-50">
            <tr>
              {selectable ? (
                <th scope="col" className="table-head w-10">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    className="h-4 w-4 cursor-pointer rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                    checked={allSelected}
                    onChange={toggleAll}
                    disabled={loading || rows.length === 0}
                    aria-label="Select all rows on this page"
                  />
                </th>
              ) : null}
              {columns.map((column) => (
                <th key={column.key} scope="col" className={`table-head ${column.className ?? ""}`}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <SkeletonRows columns={columns.length} selectable={selectable} />
            ) : rows.length > 0 ? (
              rows.map((row) => {
                const id = rowKey(row)
                const isSelected = selectedIds.includes(id)
                return (
                  <tr
                    key={id}
                    className={`border-t border-ink-100 transition ${
                      isSelected ? "bg-brand-50/60" : "hover:bg-ink-50/70"
                    }`}
                  >
                    {selectable ? (
                      <td className="table-cell w-10">
                        <input
                          type="checkbox"
                          className="h-4 w-4 cursor-pointer rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                          checked={isSelected}
                          onChange={() => toggleRow(id)}
                          aria-label="Select row"
                        />
                      </td>
                    ) : null}
                    {columns.map((column) => (
                      <td key={column.key} className={`table-cell ${column.className ?? ""}`}>
                        {column.render(row)}
                      </td>
                    ))}
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)}>
                  {error ? (
                    <EmptyState
                      title="Could not load this list"
                      message={error}
                      action={
                        onRetry ? (
                          <button type="button" className="btn-secondary btn-sm" onClick={onRetry}>
                            Try again
                          </button>
                        ) : undefined
                      }
                    />
                  ) : (
                    <EmptyState title={emptyTitle} message={emptyMessage} action={emptyAction} />
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {meta && onPageChange && !error ? (
        <Pagination meta={meta} onPageChange={onPageChange} disabled={loading} />
      ) : null}
    </div>
  )
}
