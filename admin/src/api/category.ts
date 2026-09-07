import { z } from "zod"
import { api } from "@/lib/api"
import { categorySchema, type Category } from "@/types"
import type { CategoryFormValues } from "@/types/forms"
import type { ListParams, Paged } from "@/api/shared"

/** GET /category?search=&status=&page=&limit= */
export async function fetchCategoryList(
  params: ListParams = {},
  signal?: AbortSignal,
): Promise<Paged<Category>> {
  const res = await api.get("/category", z.array(categorySchema), { params, signal })
  return { rows: res.data, meta: res.meta }
}

/** Every category (capped at the backend's 100/page) for form dropdowns. */
export async function fetchCategoryOptions(signal?: AbortSignal): Promise<Category[]> {
  const res = await api.get("/category", z.array(categorySchema), { params: { limit: 100 }, signal })
  return res.data
}

/** GET /category/:slug */
export async function fetchCategoryBySlug(slug: string, signal?: AbortSignal): Promise<Category> {
  const res = await api.get(`/category/${encodeURIComponent(slug)}`, categorySchema, { signal })
  return res.data
}

export type CategoryInput = CategoryFormValues & {
  imageUrl?: string
  imagePublicId?: string
}

/** POST /category (JSON). */
export async function createCategory(input: CategoryInput): Promise<Category> {
  const res = await api.post("/category", categorySchema, input)
  return res.data
}

/** PUT /category/:slug (JSON). */
export async function updateCategory(slug: string, input: CategoryInput): Promise<Category> {
  const res = await api.put(`/category/${encodeURIComponent(slug)}`, categorySchema, input)
  return res.data
}

/** DELETE /category/:slug */
export async function deleteCategory(slug: string): Promise<string> {
  const res = await api.delete(`/category/${encodeURIComponent(slug)}`, z.null())
  return res.message
}
