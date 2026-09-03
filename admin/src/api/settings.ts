import { z } from "zod"
import { api } from "@/lib/api"
import { buildFormData } from "@/lib/formData"
import { settingsSchema, type SiteSettings } from "@/types"

/** GET /settings — fetches the singleton settings document. */
export async function fetchSettings(signal?: AbortSignal): Promise<SiteSettings> {
  const res = await api.get("/settings", settingsSchema, { signal })
  return res.data
}

/** PUT /settings — multipart (image field: "image"). */
export async function updateSettings(
  values: {
    leadModalEnabled: boolean
    leadModalHeadline: string
    leadModalBody: string
    leadModalShowDelayMs: number
    leadModalCooldownDays: number
  },
  file: File | null,
): Promise<SiteSettings> {
  const form = buildFormData(
    {
      leadModalEnabled: values.leadModalEnabled,
      leadModalHeadline: values.leadModalHeadline,
      leadModalBody: values.leadModalBody,
      leadModalShowDelayMs: values.leadModalShowDelayMs,
      leadModalCooldownDays: values.leadModalCooldownDays,
    },
    file,
  )
  const res = await api.put("/settings", settingsSchema, form)
  return res.data
}
