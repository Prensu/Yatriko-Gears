import mongoose from "mongoose"
import { ImageSchema } from "../../utilities/commonSchema"

/**
 * Singleton site-settings document. Only one ever exists — the controller
 * upserts it with a fixed filter (`{}`). If no document exists, the GET
 * handler returns sane defaults that match the current hardcoded values.
 */
const SettingsSchema = new mongoose.Schema(
  {
    leadModalEnabled: { type: Boolean, default: true },
    leadModalImage: ImageSchema,
    leadModalHeadline: { type: String, default: "Grand Opening Offer" },
    leadModalBody: {
      type: String,
      default: "on every rental gear — 21 to 31 Shrawan. Drop your email and claim the deal.",
    },
    leadModalShowDelayMs: { type: Number, default: 5000 },
    leadModalCooldownDays: { type: Number, default: 7 },
  },
  { autoCreate: true, autoIndex: true, timestamps: true },
)

export default mongoose.model("Settings", SettingsSchema)
