import { z } from "zod"
import { api } from "@/lib/api"
import { blogSchema, type Blog } from "@/types"

const blogListSchema = z.array(blogSchema)

export type BlogListResult = {
  posts: Blog[]
  page: number
  limit: number
  total: number
}

export async function fetchBlogList(page = 1, limit = 9): Promise<BlogListResult> {
  const result = await api.get(`/blog?page=${page}&limit=${limit}`, blogListSchema)
  const meta = result.meta as { page?: number; limit?: number; total?: number } | undefined
  return {
    posts: result.data,
    page: meta?.page ?? page,
    limit: meta?.limit ?? limit,
    total: meta?.total ?? result.data.length,
  }
}

export async function fetchBlogBySlug(slug: string): Promise<Blog> {
  const result = await api.get(`/blog/${encodeURIComponent(slug)}`, blogSchema)
  return result.data
}
