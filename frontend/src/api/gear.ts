import { z } from "zod"
import { api } from "@/lib/api"
import { gearSchema, packageSchema, destinationSchema, videoSchema, type Gear, type Package, type Destination, type Video } from "@/types"
import { FALLBACK_GEAR } from "@/lib/fallbackData"

/**
 * Gear endpoints (feature module: src/modules/gear on the backend).
 * Falls back to the bundled price list if the API is unreachable,
 * so the site still renders during early development.
 */

/**
 * The fallbacks below hide *any* failure — including a Zod error caused by a
 * field the schema does not expect — which makes stale content look like live
 * content. Always say so in the console.
 */
function warnFallback(endpoint: string, error: unknown): void {
  console.warn(
    `[api] ${endpoint} failed — rendering fallback data, not live content.`,
    error,
  )
}
/**
 * The catalogue pages filter client-side and have no pagination UI, so ask for
 * the whole list. Without an explicit limit the backend defaults to 10 and the
 * page silently shows a fraction of the catalogue (100 is its hard cap).
 */
const CATALOGUE_LIMIT = 100

export async function fetchGear(params?: {
  category?: string
  page?: number
  limit?: number
}): Promise<Gear[]> {
  try {
    const qs = new URLSearchParams()
    if (params?.category) qs.set("category", params.category)
    if (params?.page) qs.set("page", String(params.page))
    qs.set("limit", String(params?.limit ?? CATALOGUE_LIMIT))
    const { data } = await api.get(`/gear?${qs}`, z.array(gearSchema))
    return data
  } catch (error) {
    warnFallback("GET /gear", error)
    return FALLBACK_GEAR
  }
}

export async function fetchGearBySlug(slug: string): Promise<Gear | undefined> {
  try {
    const { data } = await api.get(`/gear/${slug}`, gearSchema)
    return data
  } catch (error) {
    warnFallback(`GET /gear/${slug}`, error)
    return FALLBACK_GEAR.find((g) => g.slug === slug)
  }
}

export async function fetchPackages(): Promise<Package[]> {
  try {
    const { data } = await api.get(`/package?limit=${CATALOGUE_LIMIT}`, z.array(packageSchema))
    return data
  } catch (error) {
    // No fallback packages yet — return empty so the UI degrades gracefully.
    warnFallback("GET /package", error)
    return []
  }
}

export async function fetchDestinations(): Promise<Destination[]> {
  try {
    const { data } = await api.get(`/destination?limit=${CATALOGUE_LIMIT}`, z.array(destinationSchema))
    return data
  } catch (error) {
    // No fallback destinations yet — return empty so the UI degrades gracefully.
    warnFallback("GET /destination", error)
    return []
  }
}

export async function fetchVideos(): Promise<Video[]> {
  try {
    const { data } = await api.get("/video", z.array(videoSchema))
    return data
  } catch (error) {
    // No fallback videos yet — return empty so the UI degrades gracefully.
    warnFallback("GET /video", error)
    return []
  }
}
