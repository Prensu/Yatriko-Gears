import { z } from "zod"
import { api } from "@/lib/api"
import { gearSchema, packageSchema, destinationSchema, videoSchema, type Gear, type Package, type Destination, type Video } from "@/types"
import { FALLBACK_GEAR } from "@/lib/fallbackData"

/**
 * Gear endpoints (feature module: src/modules/gear on the backend).
 * Falls back to the bundled price list if the API is unreachable,
 * so the site still renders during early development.
 */
export async function fetchGear(params?: { category?: string; page?: number }): Promise<Gear[]> {
  try {
    const qs = new URLSearchParams()
    if (params?.category) qs.set("category", params.category)
    if (params?.page) qs.set("page", String(params.page))
    const suffix = qs.size ? `?${qs}` : ""
    const { data } = await api.get(`/gear${suffix}`, z.array(gearSchema))
    return data
  } catch {
    return FALLBACK_GEAR
  }
}

export async function fetchGearBySlug(slug: string): Promise<Gear | undefined> {
  try {
    const { data } = await api.get(`/gear/${slug}`, gearSchema)
    return data
  } catch {
    return FALLBACK_GEAR.find((g) => g.slug === slug)
  }
}

export async function fetchPackages(): Promise<Package[]> {
  try {
    const { data } = await api.get("/package", z.array(packageSchema))
    return data
  } catch {
    // No fallback packages yet — return empty so the UI degrades gracefully.
    return []
  }
}

export async function fetchDestinations(): Promise<Destination[]> {
  try {
    const { data } = await api.get("/destination", z.array(destinationSchema))
    return data
  } catch {
    // No fallback destinations yet — return empty so the UI degrades gracefully.
    return []
  }
}

export async function fetchVideos(): Promise<Video[]> {
  try {
    const { data } = await api.get("/video", z.array(videoSchema))
    return data
  } catch {
    // No fallback videos yet — return empty so the UI degrades gracefully.
    return []
  }
}
