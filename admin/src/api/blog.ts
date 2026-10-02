import { z } from "zod"
import { api } from "@/lib/api"
import { blogSchema, type Blog } from "@/types"
import type { BlogFormValues } from "@/types/forms"
import type { ListParams, Paged } from "@/api/shared"

/** GET /blog?search=&status=&page=&limit= */
export async function fetchBlogList(
  params: ListParams = {},
  signal?: AbortSignal,
): Promise<Paged<Blog>> {
  const res = await api.get("/blog", blogSchema.array(), { params, signal })
  return { rows: res.data, meta: res.meta }
}

/** GET /blog/:slug — admins can edit inactive posts. */
export async function fetchBlogBySlug(slug: string, signal?: AbortSignal): Promise<Blog> {
  const res = await api.get(`/blog/${encodeURIComponent(slug)}`, blogSchema, { signal })
  return res.data
}

export type BlogInput = BlogFormValues & {
  coverImageUrl?: string
  coverImagePublicId?: string
}

/** POST /blog (JSON, after the direct Cloudinary upload). */
export async function createBlog(input: BlogInput): Promise<Blog> {
  const res = await api.post("/blog", blogSchema, input)
  return res.data
}

/** PUT /blog/:slug (JSON). */
export async function updateBlog(slug: string, input: BlogInput): Promise<Blog> {
  const res = await api.put(`/blog/${encodeURIComponent(slug)}`, blogSchema, input)
  return res.data
}

/** DELETE /blog/:slug */
export async function deleteBlog(slug: string): Promise<string> {
  const res = await api.delete(`/blog/${encodeURIComponent(slug)}`, z.null())
  return res.message
}
