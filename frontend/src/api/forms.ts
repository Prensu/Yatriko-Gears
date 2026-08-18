import { z } from "zod"
import { api } from "@/lib/api"
import type { ContactFormValues, SubscriberFormValues } from "@/types/forms"

/** POST /api/v1/contact */
export function submitContact(values: ContactFormValues) {
  return api.post("/contact", z.object({ _id: z.string() }).partial(), values)
}

/** POST /api/v1/subscriber — lead-capture modal */
export function subscribe(values: SubscriberFormValues) {
  return api.post("/subscriber", z.object({ _id: z.string() }).partial(), values)
}
