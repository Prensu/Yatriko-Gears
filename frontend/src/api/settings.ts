import { api } from "@/lib/api"
import { settingsSchema, type SiteSettings } from "@/types"

/** Hardcoded fallback matching the original LeadCaptureModal constants. */
const FALLBACK_SETTINGS: SiteSettings = {
  leadModalEnabled: true,
  leadModalImage: "",
  leadModalHeadline: "Grand Opening Offer",
  leadModalBody:
    "on every rental gear — 21 to 31 Shrawan. Drop your email and claim the deal.",
  leadModalShowDelayMs: 5000,
  leadModalCooldownDays: 7,
}

/**
 * Fetch site settings (lead popup config). Falls back gracefully to
 * hardcoded defaults if the API is unreachable or the response shape
 * changes — same pattern as gear.ts for the fallback trap.
 */
export async function fetchSettings(): Promise<SiteSettings> {
  try {
    const { data } = await api.get("/settings", settingsSchema)
    return data
  } catch (error) {
    console.warn(
      "[api] GET /settings failed — rendering fallback popup config, not live settings.",
      error,
    )
    return FALLBACK_SETTINGS
  }
}
