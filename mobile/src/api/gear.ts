import { z } from "zod"
import { api } from "@/lib/api"
import {
  destinationSchema,
  gearCategorySchema,
  gearSchema,
  packageSchema,
  type Destination,
  type Gear,
  type GearCategory,
  type Package,
} from "@/types"

/** Backend defaults to 10 per page when no limit is given; 100 is its hard cap. */
export const CATALOGUE_LIMIT = 100

type Meta = { page?: number; limit?: number; total?: number } | undefined

export type GearPage = { gear: Gear[]; page: number; limit: number; total: number }

export async function fetchGearPage(params?: {
  category?: string
  search?: string
  page?: number
  limit?: number
}): Promise<GearPage> {
  const page = params?.page ?? 1
  const limit = params?.limit ?? 20
  const qs = new URLSearchParams()
  if (params?.category) qs.set("category", params.category)
  if (params?.search) qs.set("search", params.search)
  qs.set("page", String(page))
  qs.set("limit", String(limit))
  const result = await api.get(`/gear?${qs}`, z.array(gearSchema))
  const meta = result.meta as Meta
  return {
    gear: result.data,
    page: meta?.page ?? page,
    limit: meta?.limit ?? limit,
    total: meta?.total ?? result.data.length,
  }
}

export async function fetchGearBySlug(slug: string): Promise<Gear> {
  const { data } = await api.get(`/gear/${encodeURIComponent(slug)}`, gearSchema)
  return data
}

export async function fetchCategories(): Promise<GearCategory[]> {
  const { data } = await api.get(`/category?limit=${CATALOGUE_LIMIT}`, z.array(gearCategorySchema))
  return data
}

export async function fetchPackages(): Promise<Package[]> {
  const { data } = await api.get(`/package?limit=${CATALOGUE_LIMIT}`, z.array(packageSchema))
  return data
}

export async function fetchDestinations(): Promise<Destination[]> {
  const { data } = await api.get(`/destination?limit=${CATALOGUE_LIMIT}`, z.array(destinationSchema))
  return data
}
