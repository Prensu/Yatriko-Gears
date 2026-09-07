import { z } from "zod"
import { api } from "@/lib/api"
import { destinationSchema, type Destination } from "@/types"
import type { DestinationFormValues } from "@/types/forms"
import type { ListParams, Paged } from "@/api/shared"

/** GET /destination?search=&page=&limit= */
export async function fetchDestinationList(
  params: ListParams = {},
  signal?: AbortSignal,
): Promise<Paged<Destination>> {
  const res = await api.get("/destination", z.array(destinationSchema), { params, signal })
  return { rows: res.data, meta: res.meta }
}

/** GET /destination/:slug */
export async function fetchDestinationBySlug(slug: string, signal?: AbortSignal): Promise<Destination> {
  const res = await api.get(`/destination/${encodeURIComponent(slug)}`, destinationSchema, { signal })
  return res.data
}

export type DestinationInput = DestinationFormValues & {
  imageUrl?: string
  imagePublicId?: string
}

/** POST /destination (JSON). */
export async function createDestination(input: DestinationInput): Promise<Destination> {
  const res = await api.post("/destination", destinationSchema, input)
  return res.data
}

/** PUT /destination/:slug (JSON). */
export async function updateDestination(slug: string, input: DestinationInput): Promise<Destination> {
  const res = await api.put(`/destination/${encodeURIComponent(slug)}`, destinationSchema, input)
  return res.data
}

/** DELETE /destination/:slug */
export async function deleteDestination(slug: string): Promise<string> {
  const res = await api.delete(`/destination/${encodeURIComponent(slug)}`, z.null())
  return res.message
}
