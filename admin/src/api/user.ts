import { z } from "zod"
import { api } from "@/lib/api"
import { adminUserSchema, type AdminUser } from "@/types/auth"
import type { ListParams, Paged } from "@/api/shared"

/** GET /user?role=&search=&page=&limit= — admin only. */
export async function fetchUserList(
  params: ListParams = {},
  signal?: AbortSignal,
): Promise<Paged<AdminUser>> {
  const res = await api.get("/user", z.array(adminUserSchema), { params, signal })
  return { rows: res.data, meta: res.meta }
}

/** DELETE /user/:id — also revokes that user's active sessions. */
export async function deleteUser(id: string): Promise<string> {
  const res = await api.delete(`/user/${encodeURIComponent(id)}`, z.null())
  return res.message
}
