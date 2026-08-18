import { z } from "zod"
import { api } from "@/lib/api"
import { buildFormData } from "@/lib/formData"
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

function destinationFormData(values: DestinationFormValues, file: File | null): FormData {
  return buildFormData(
    {
      name: values.name,
      blurb: values.blurb,
      status: values.status,
    },
    file,
  )
}

/** POST /destination — multipart, file field "image". */
export async function createDestination(
  values: DestinationFormValues,
  file: File | null,
): Promise<Destination> {
  const res = await api.post("/destination", destinationSchema, destinationFormData(values, file))
  return res.data
}

/** PUT /destination/:slug */
export async function updateDestination(
  slug: string,
  values: DestinationFormValues,
  file: File | null,
): Promise<Destination> {
  const res = await api.put(
    `/destination/${encodeURIComponent(slug)}`,
    destinationSchema,
    destinationFormData(values, file),
  )
  return res.data
}

/** DELETE /destination/:slug */
export async function deleteDestination(slug: string): Promise<string> {
  const res = await api.delete(`/destination/${encodeURIComponent(slug)}`, z.null())
  return res.message
}
