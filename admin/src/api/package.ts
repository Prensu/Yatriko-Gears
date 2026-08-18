import { z } from "zod"
import { api } from "@/lib/api"
import { packageSchema, type Package } from "@/types"
import type { PackageFormValues } from "@/types/forms"
import type { ListParams, Paged } from "@/api/shared"

/**
 * Packages are the one content module whose write routes have no multer
 * middleware (and no image on the model), so these calls send plain JSON.
 */

/** GET /package?search=&page=&limit= */
export async function fetchPackageList(
  params: ListParams = {},
  signal?: AbortSignal,
): Promise<Paged<Package>> {
  const res = await api.get("/package", z.array(packageSchema), { params, signal })
  return { rows: res.data, meta: res.meta }
}

/** GET /package/:slug */
export async function fetchPackageBySlug(slug: string, signal?: AbortSignal): Promise<Package> {
  const res = await api.get(`/package/${encodeURIComponent(slug)}`, packageSchema, { signal })
  return res.data
}

/** POST /package — JSON body. */
export async function createPackage(values: PackageFormValues): Promise<Package> {
  const res = await api.post("/package", packageSchema, values)
  return res.data
}

/** PUT /package/:slug — JSON body. */
export async function updatePackage(slug: string, values: PackageFormValues): Promise<Package> {
  const res = await api.put(`/package/${encodeURIComponent(slug)}`, packageSchema, values)
  return res.data
}

/** DELETE /package/:slug */
export async function deletePackage(slug: string): Promise<string> {
  const res = await api.delete(`/package/${encodeURIComponent(slug)}`, z.null())
  return res.message
}
