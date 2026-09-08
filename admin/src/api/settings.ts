import { api } from "@/lib/api"
import { settingsSchema, type SiteSettings } from "@/types"

/** GET /settings — fetches the singleton settings document. */
export async function fetchSettings(signal?: AbortSignal): Promise<SiteSettings> {
  const res = await api.get("/settings", settingsSchema, { signal })
  return res.data
}

export type SettingsInput = {
  leadModalEnabled: boolean
  leadModalHeadline: string
  leadModalBody: string
  leadModalShowDelayMs: number
  leadModalCooldownDays: number
  imageUrl?: string
  imagePublicId?: string
}

/** PUT /settings — JSON. */
export async function updateSettings(input: SettingsInput): Promise<SiteSettings> {
  const res = await api.put("/settings", settingsSchema, input)
  return res.data
}
