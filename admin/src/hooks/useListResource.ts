import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { errorMessage, isCanceled } from "@/lib/api"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import type { ListFetcher } from "@/api/shared"
import type { PaginationMeta } from "@/types"

type Options = {
  limit?: number
  initialFilters?: Record<string, string>
}

export type ListResource<T> = {
  rows: T[]
  meta: PaginationMeta | null
  loading: boolean
  error: string | null
  page: number
  setPage: (page: number) => void
  search: string
  setSearch: (search: string) => void
  filters: Record<string, string>
  setFilter: (key: string, value: string) => void
  reload: () => void
  /** Reload after a delete, stepping back a page if the last row just went. */
  reloadAfterDelete: (deletedCount?: number) => void
}

/**
 * Shared list state for every table screen: server-side search (debounced),
 * filters, pagination from `meta`, plus abortable refetching.
 * `fetcher` must be a module-level function so its identity stays stable.
 */
export function useListResource<T>(fetcher: ListFetcher<T>, options: Options = {}): ListResource<T> {
  const limit = options.limit ?? 10
  const initialFilters = options.initialFilters

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [filters, setFilters] = useState<Record<string, string>>(() => initialFilters ?? {})
  const [rows, setRows] = useState<T[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const debouncedSearch = useDebouncedValue(search)
  // Serialized so the effect can depend on filter *contents*, not identity.
  const filterKey = useMemo(() => JSON.stringify(filters), [filters])

  // Any new search/filter starts back at page 1 — but not on first render.
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    setPage(1)
  }, [debouncedSearch, filterKey])

  useEffect(() => {
    const controller = new AbortController()
    const activeFilters = JSON.parse(filterKey) as Record<string, string>

    setLoading(true)
    setError(null)

    fetcher({ page, limit, search: debouncedSearch || undefined, ...activeFilters }, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return
        setRows(result.rows)
        setMeta(result.meta)
        setLoading(false)
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted || isCanceled(cause)) return
        setRows([])
        setMeta(null)
        setError(errorMessage(cause, "Could not load this list"))
        setLoading(false)
      })

    return () => controller.abort()
  }, [fetcher, page, limit, debouncedSearch, filterKey, reloadKey])

  const reload = useCallback(() => setReloadKey((key) => key + 1), [])

  const setFilter = useCallback((key: string, value: string) => {
    setFilters((current) => {
      const next = { ...current }
      if (value) next[key] = value
      else delete next[key]
      return next
    })
  }, [])

  const reloadAfterDelete = useCallback(
    (deletedCount = 1) => {
      if (page > 1 && rows.length <= deletedCount) setPage(page - 1)
      else reload()
    },
    [page, rows.length, reload],
  )

  return {
    rows,
    meta,
    loading,
    error,
    page,
    setPage,
    search,
    setSearch,
    filters,
    setFilter,
    reload,
    reloadAfterDelete,
  }
}
