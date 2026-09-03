import type { NextFunction, Response } from "express"
import SettingsModel from "./SettingsModel"
import { mapImage } from "../../utilities/helpers"
import type { IAuthRequest } from "../auth/AuthContract"

/** Sane defaults matching the current hardcoded values in LeadCaptureModal. */
const DEFAULTS = {
  leadModalEnabled: true,
  leadModalImage: "",
  leadModalHeadline: "Grand Opening Offer",
  leadModalBody:
    "on every rental gear — 21 to 31 Shrawan. Drop your email and claim the deal.",
  leadModalShowDelayMs: 5000,
  leadModalCooldownDays: 7,
}

class SettingsController {
  /** GET /api/v1/settings — public. Returns the singleton or defaults. */
  getSettings = async (_req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const doc = await SettingsModel.findOne()
      const data = doc
        ? {
            leadModalEnabled: doc.leadModalEnabled ?? DEFAULTS.leadModalEnabled,
            leadModalImage:
              doc.leadModalImage && typeof doc.leadModalImage === "object" && "url" in doc.leadModalImage
                ? (doc.leadModalImage as { url: string }).url
                : DEFAULTS.leadModalImage,
            leadModalHeadline: doc.leadModalHeadline ?? DEFAULTS.leadModalHeadline,
            leadModalBody: doc.leadModalBody ?? DEFAULTS.leadModalBody,
            leadModalShowDelayMs: doc.leadModalShowDelayMs ?? DEFAULTS.leadModalShowDelayMs,
            leadModalCooldownDays: doc.leadModalCooldownDays ?? DEFAULTS.leadModalCooldownDays,
          }
        : DEFAULTS

      res.json({ data, message: "Site settings", meta: null })
    } catch (exception) {
      next(exception)
    }
  }

  /** PUT /api/v1/settings — admin-only, multipart. Upserts the singleton. */
  updateSettings = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = req.body

      if (req.file) {
        body.leadModalImage = mapImage(req.file as Express.Multer.File, "settings/")
      }

      const doc = await SettingsModel.findOneAndUpdate({}, body, {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      })

      const data = {
        leadModalEnabled: doc.leadModalEnabled ?? DEFAULTS.leadModalEnabled,
        leadModalImage:
          doc.leadModalImage && typeof doc.leadModalImage === "object" && "url" in doc.leadModalImage
            ? (doc.leadModalImage as { url: string }).url
            : DEFAULTS.leadModalImage,
        leadModalHeadline: doc.leadModalHeadline ?? DEFAULTS.leadModalHeadline,
        leadModalBody: doc.leadModalBody ?? DEFAULTS.leadModalBody,
        leadModalShowDelayMs: doc.leadModalShowDelayMs ?? DEFAULTS.leadModalShowDelayMs,
        leadModalCooldownDays: doc.leadModalCooldownDays ?? DEFAULTS.leadModalCooldownDays,
      }

      res.json({ data, message: "Settings updated successfully", meta: null })
    } catch (exception) {
      next(exception)
    }
  }
}

export default SettingsController
