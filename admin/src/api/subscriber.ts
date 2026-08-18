import { z } from "zod"
import { api } from "@/lib/api"
import { subscriberSchema, type Subscriber } from "@/types"
import type { ListParams, Paged } from "@/api/shared"

/** GET /subscriber?search=&page=&limit= */
export async function fetchSubscriberList(
  params: ListParams = {},
  signal?: AbortSignal,
): Promise<Paged<Subscriber>> {
  const res = await api.get("/subscriber", z.array(subscriberSchema), { params, signal })
  return { rows: res.data, meta: res.meta }
}

/**
 * Every subscriber, walked page by page (the backend caps limit at 100)
 * so "Export CSV" covers the whole list, not just the visible page.
 */
export async function fetchAllSubscribers(search?: string): Promise<Subscriber[]> {
  const all: Subscriber[] = []
  const limit = 100

  for (let page = 1; page <= 50; page += 1) {
    const { rows, meta } = await fetchSubscriberList({ page, limit, search })
    all.push(...rows)

    const total = meta?.total ?? all.length
    if (rows.length < limit || all.length >= total) break
  }

  return all
}

/** DELETE /subscriber/:id */
export async function deleteSubscriber(id: string): Promise<string> {
  const res = await api.delete(`/subscriber/${encodeURIComponent(id)}`, z.null())
  return res.message
}
