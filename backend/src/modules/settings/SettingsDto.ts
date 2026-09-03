import { z } from "zod"

/**
 * Multipart-safe DTO for PUT /settings.
 *
 * Boolean trap: z.coerce.boolean() uses Boolean(input), so the string
 * "false" coerces to TRUE. Clients send "" for false and "true" for true;
 * we preprocess to handle both cases safely.
 */
function booleanFromMultipart() {
  return z.preprocess((value) => {
    if (typeof value === "boolean") return value
    if (value === "true" || value === "1") return true
    // "", "false", "0", or missing → false
    return false
  }, z.boolean())
}

export const SettingsUpdateDTO = z.object({
  leadModalEnabled: booleanFromMultipart().default(true),
  leadModalHeadline: z.string().min(1, "Headline is required").max(200).default("Grand Opening Offer"),
  leadModalBody: z.string().max(500).default(""),
  leadModalShowDelayMs: z.coerce.number().int().min(0).default(5000),
  leadModalCooldownDays: z.coerce.number().int().min(0).default(7),
})

export type SettingsUpdateInput = z.infer<typeof SettingsUpdateDTO>
