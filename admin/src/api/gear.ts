import { z } from "zod"
import { api } from "@/lib/api"
import { buildFormData } from "@/lib/formData"
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

function gearFormData(values: GearFormValues, file: File | null): FormData {
  return buildFormData(
    {
      name: values.name,
      description: values.description,
      realPrice: values.realPrice,
      discountedPrice: values.discountedPrice,
      availableFor: values.availableFor,
      colors: values.colors,
      specs: values.specs,
      category: values.category,
      isNew: values.isNew,
      status: values.status,
    },
    file,
  )
}

/** POST /gear — multipart, file field "image". */
export async function createGear(values: GearFormValues, file: File | null): Promise<Gear> {
  const res = await api.post("/gear", gearSchema, gearFormData(values, file))
  return res.data
}

/** PUT /gear/:slug — multipart; the image is only replaced when a file is picked. */
export async function updateGear(slug: string, values: GearFormValues, file: File | null): Promise<Gear> {
  const res = await api.put(`/gear/${encodeURIComponent(slug)}`, gearSchema, gearFormData(values, file))
  return res.data
}

/** DELETE /gear/:slug */
export async function deleteGear(slug: string): Promise<string> {
  const res = await api.delete(`/gear/${encodeURIComponent(slug)}`, z.null())
  return res.message
}
