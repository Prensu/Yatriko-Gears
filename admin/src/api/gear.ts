import { z } from "zod"
import { api } from "@/lib/api"
import { gearSchema, type Gear } from "@/types"
import type { GearFormValues } from "@/types/forms"
import type { ListParams, Paged } from "@/api/shared"

/** GET /gear?search=&category=&page=&limit= */
export async function fetchGearList(params: ListParams = {}, signal?: AbortSignal): Promise<Paged<Gear>> {
  const res = await api.get("/gear", z.array(gearSchema), { params, signal })
  return { rows: res.data, meta: res.meta }
}

/** GET /gear/:slug — works for inactive gear too, so edit links never 404. */
export async function fetchGearBySlug(slug: string, signal?: AbortSignal): Promise<Gear> {
  const res = await api.get(`/gear/${encodeURIComponent(slug)}`, gearSchema, { signal })
  return res.data
}

export type GearInput = GearFormValues & {
  imageUrl?: string
  imagePublicId?: string
}

/** POST /gear (JSON). */
export async function createGear(input: GearInput): Promise<Gear> {
  const res = await api.post("/gear", gearSchema, input)
  return res.data
}

/** PUT /gear/:slug (JSON). */
export async function updateGear(slug: string, input: GearInput): Promise<Gear> {
  const res = await api.put(`/gear/${encodeURIComponent(slug)}`, gearSchema, input)
  return res.data
}

/** DELETE /gear/:slug */
export async function deleteGear(slug: string): Promise<string> {
  const res = await api.delete(`/gear/${encodeURIComponent(slug)}`, z.null())
  return res.message
}
