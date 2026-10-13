import { z } from "zod"
import { api } from "@/lib/api"
import type { ContactFormValues } from "@/types/forms"

export function submitContact(values: ContactFormValues) {
  return api.post("/contact", z.object({ _id: z.string() }).partial(), values)
}
