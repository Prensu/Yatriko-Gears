import { z } from "zod"
import { api } from "@/lib/api"
import { buildFormData } from "@/lib/formData"
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

function categoryFormData(values: CategoryFormValues, file: File | null): FormData {
  return buildFormData(
    {
      name: values.name,
      description: values.description,
      status: values.status,
    },
    file,
  )
}

/** POST /category — multipart, file field "image". */
export async function createCategory(values: CategoryFormValues, file: File | null): Promise<Category> {
  const res = await api.post("/category", categorySchema, categoryFormData(values, file))
  return res.data
}

/** PUT /category/:slug */
export async function updateCategory(
  slug: string,
  values: CategoryFormValues,
  file: File | null,
): Promise<Category> {
  const res = await api.put(
    `/category/${encodeURIComponent(slug)}`,
    categorySchema,
    categoryFormData(values, file),
  )
  return res.data
}

/** DELETE /category/:slug */
export async function deleteCategory(slug: string): Promise<string> {
  const res = await api.delete(`/category/${encodeURIComponent(slug)}`, z.null())
  return res.message
}
