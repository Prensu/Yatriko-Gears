import type { NextFunction, Response } from "express"
import SettingsModel from "./SettingsModel"
import { destroyCloudinaryImage, mapCloudinaryImage } from "../../utilities/helpers"
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

  /** PUT /api/v1/settings — admin-only, JSON. Upserts the singleton. */
  updateSettings = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = req.body

      if (body.imageUrl && body.imagePublicId) {
        const existing = await SettingsModel.findOne()
        const oldPath =
          existing?.leadModalImage &&
          typeof existing.leadModalImage === "object" &&
          "path" in existing.leadModalImage
            ? (existing.leadModalImage as { path?: string }).path
            : undefined
        if (oldPath && oldPath !== body.imagePublicId) {
          await destroyCloudinaryImage(oldPath)
        }
        body.leadModalImage = mapCloudinaryImage({ url: body.imageUrl, publicId: body.imagePublicId })
      }
      delete body.imageUrl
      delete body.imagePublicId

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
