import { useMemo } from "react"
import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import {
  CATALOGUE_LIMIT,
  fetchCategories,
  fetchDestinations,
  fetchGearBySlug,
  fetchGearPage,
  fetchPackages,
} from "@/api/gear"
import type { Gear } from "@/types"

export const catalogueKeys = {
  gearList: (category: string, search: string) => ["gear", "list", category, search] as const,
  gearIndex: ["gear", "index"] as const,
  gear: (slug: string) => ["gear", "detail", slug] as const,
  categories: ["categories"] as const,
  packages: ["packages"] as const,
  destinations: ["destinations"] as const,
}

const PAGE_SIZE = 20

/** Browse screen: pages of 20, loaded as the list scrolls. */
export function useGearInfinite(params: { category: string; search: string }) {
  return useInfiniteQuery({
    queryKey: catalogueKeys.gearList(params.category, params.search),
    queryFn: ({ pageParam }) =>
      fetchGearPage({
        category: params.category || undefined,
        search: params.search || undefined,
        page: pageParam,
        limit: PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page * last.limit < last.total ? last.page + 1 : undefined),
  })
}

export function useGearDetail(slug: string) {
  return useQuery({ queryKey: catalogueKeys.gear(slug), queryFn: () => fetchGearBySlug(slug), enabled: Boolean(slug) })
}

/** The whole catalogue (<=100 items) for places that need to look gear up by id (cart, checkout, home). */
export function useGearIndex() {
  const query = useQuery({
    queryKey: catalogueKeys.gearIndex,
    queryFn: () => fetchGearPage({ page: 1, limit: CATALOGUE_LIMIT }),
  })
  const byId = useMemo(() => {
    const map = new Map<string, Gear>()
    for (const gear of query.data?.gear ?? []) map.set(gear._id, gear)
    return map
  }, [query.data])
  return { ...query, gear: query.data?.gear ?? [], byId }
}

export function useCategories() {
  return useQuery({ queryKey: catalogueKeys.categories, queryFn: fetchCategories, staleTime: 10 * 60_000 })
}

export function usePackages() {
  return useQuery({ queryKey: catalogueKeys.packages, queryFn: fetchPackages })
}

export function useDestinations() {
  return useQuery({ queryKey: catalogueKeys.destinations, queryFn: fetchDestinations })
}
