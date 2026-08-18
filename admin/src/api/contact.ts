import { z } from "zod"
import { api } from "@/lib/api"
import { contactSchema, type Contact, type LeadStatus } from "@/types"
import type { ListParams, Paged } from "@/api/shared"

/** GET /contact?status=&search=&page=&limit= — admin inbox. */
export async function fetchContactList(
  params: ListParams = {},
  signal?: AbortSignal,
): Promise<Paged<Contact>> {
  const res = await api.get("/contact", z.array(contactSchema), { params, signal })
  return { rows: res.data, meta: res.meta }
}

/** PATCH /contact/:id/status — mark a lead read or handled (resolved). */
export async function updateContactStatus(id: string, status: LeadStatus): Promise<Contact> {
  const res = await api.patch(`/contact/${encodeURIComponent(id)}/status`, contactSchema, { status })
  return res.data
}

/** DELETE /contact/:id */
export async function deleteContact(id: string): Promise<string> {
  const res = await api.delete(`/contact/${encodeURIComponent(id)}`, z.null())
  return res.message
}
