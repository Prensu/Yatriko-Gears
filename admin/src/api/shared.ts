import type { PaginationMeta } from "@/types"

/** Query string for every list endpoint (page, limit, search, filters). */
export type ListParams = Record<string, string | number | boolean | undefined>

/** What every list call resolves to. */
export type Paged<T> = {
  rows: T[]
  meta: PaginationMeta | null
}

/** Fetcher signature consumed by useListResource(). */
export type ListFetcher<T> = (params: ListParams, signal?: AbortSignal) => Promise<Paged<T>>
