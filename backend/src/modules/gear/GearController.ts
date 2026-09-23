import type { NextFunction, Response } from "express"
import GearModel from "./GearModel"
import CategoryModel from "../category/CategoryModel"
import { destroyCloudinaryImage, getPagination, makeSlug, mapCloudinaryImage } from "../../utilities/helpers"
import type { IAuthRequest } from "../auth/AuthContract"

/**
 * Serialize a gear document into the shape the frontend's gearSchema expects:
 * image → plain URL string (primary/thumbnail), images → array of all URLs,
 * isNewArrival → isNew.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toPublicGear(doc: any) {
  // flattenMaps: without it the `specs` Map serializes to {} and the CMS
  // editor looks like it never saved anything.
  const obj = typeof doc.toObject === "function" ? doc.toObject({ flattenMaps: true }) : doc

  // Build raw images data (url + publicId) for the CMS, and a flat URL array
  // for the public frontend.
  const rawImages: Array<{ url: string; publicId: string }> =
    Array.isArray(obj.images) && obj.images.length > 0
      ? obj.images
          .map((img: { url?: string; publicId?: string; imageUrl?: string; imagePublicId?: string }) => ({
            url: img.url ?? img.imageUrl ?? "",
            publicId: img.publicId ?? img.imagePublicId ?? "",
          }))
          .filter((img: { url: string; publicId: string }) => Boolean(img.url))
      : obj.image?.url
        ? [{ url: obj.image.url, publicId: obj.image.path ?? "" }]
        : []

  const imagesArray = rawImages.map((img) => img.url)

  return {
    ...obj,
    image: imagesArray[0] ?? obj.image?.url ?? "",
    images: imagesArray,
    imagesRaw: rawImages,
    isNew: Boolean(obj.isNewArrival),
    specs: obj.specs ?? {},
  }
}

/**
 * Map an imagesData entry (from the DTO) into the stored sub-document shape.
 */
function mapImageEntry(entry: { imageUrl?: string; url?: string; imagePublicId?: string; publicId?: string }) {
  return {
    url: entry.imageUrl ?? entry.url ?? "",
    publicId: entry.imagePublicId ?? entry.publicId ?? "",
  }
}

class GearController {
  /** POST /api/v1/gear — admin (JSON, accepts imageUrl + imagePublicId) */
  createGear = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = req.body

      data.slug = makeSlug(data.name)
      if (await GearModel.findOne({ slug: data.slug })) {
        data.slug = `${data.slug}-${Date.now()}`
      }

      // Multi-image: prefer imagesData array, fall back to legacy single fields.
      if (Array.isArray(data.imagesData) && data.imagesData.length > 0) {
        data.images = data.imagesData.map(mapImageEntry)
        // Also populate legacy `image` with the primary for backward compat.
        const primary = data.imagesData[0]
        data.image = mapCloudinaryImage({
          url: primary.imageUrl ?? primary.url ?? "",
          publicId: primary.imagePublicId ?? primary.publicId ?? "",
        })
      } else if (data.imageUrl && data.imagePublicId) {
        data.image = mapCloudinaryImage({ url: data.imageUrl, publicId: data.imagePublicId })
        data.images = [{ url: data.imageUrl, publicId: data.imagePublicId }]
      }
      delete data.imageUrl
      delete data.imagePublicId
      delete data.imagesData

      // multipart forms send "null" as a literal string — normalize FKs
      if (!data.category || data.category === "null") data.category = null

      // reserved-key mapping
      data.isNewArrival = data.isNew
      delete data.isNew

      data.createdBy = req.loggedInUser?._id
      data.updatedBy = req.loggedInUser?._id

      const gear = new GearModel(data)
      await gear.save()

      res.json({ data: toPublicGear(gear), message: "Gear created successfully", meta: null })
    } catch (exception) {
      next(exception)
    }
  }

  /** GET /api/v1/gear — public list with category/search filters */
  listAllGear = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const { page, limit, skip } = getPagination(req.query as Record<string, unknown>)

      /**
       * Public callers get the live catalogue. The CMS passes ?status=inactive
       * or ?status=all so unpublished items don't vanish from its own tables.
       */
      const requestedStatus = String(req.query.status ?? "active")
      const filter: Record<string, unknown> = {}
      if (requestedStatus !== "all") filter.status = requestedStatus
      if (req.query.search) filter.name = { $regex: String(req.query.search), $options: "i" }
      if (req.query.category) {
        const category = await CategoryModel.findOne({ slug: String(req.query.category) })
        filter.category = category?._id ?? null
      }

      const [items, total] = await Promise.all([
        GearModel.find(filter)
          .populate("category", "name slug")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        GearModel.countDocuments(filter),
      ])

      res.json({ data: items.map(toPublicGear), message: "Gear list", meta: { page, limit, total } })
    } catch (exception) {
      next(exception)
    }
  }

  /** GET /api/v1/gear/:slug — public */
  getGearDetail = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const gear = await GearModel.findOne({ slug: req.params.slug }).populate("category", "name slug")
      if (!gear) throw { code: 404, message: "Gear not found" }
      res.json({ data: toPublicGear(gear), message: "Gear detail", meta: null })
    } catch (exception) {
      next(exception)
    }
  }

  /** PUT /api/v1/gear/:slug — admin */
  updateGear = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = req.body
      delete data.slug // slug stays stable

      const existing = await GearModel.findOne({ slug: req.params.slug })
      if (!existing) throw { code: 404, message: "Gear not found" }

      // Multi-image update: prefer imagesData array, fall back to legacy.
      if (Array.isArray(data.imagesData) && data.imagesData.length > 0) {
        const newImages = data.imagesData.map(mapImageEntry)

        // Destroy Cloudinary assets that were removed.
        const newPublicIds = new Set(newImages.map((img: { publicId: string }) => img.publicId).filter(Boolean))
        const oldImages = Array.isArray(existing.images) ? existing.images : []
        for (const old of oldImages) {
          if (old.publicId && !newPublicIds.has(old.publicId)) {
            await destroyCloudinaryImage(old.publicId)
          }
        }
        if (existing.image?.path && !newPublicIds.has(existing.image.path)) {
          await destroyCloudinaryImage(existing.image.path)
        }

        data.images = newImages
        const primary = data.imagesData[0]
        data.image = mapCloudinaryImage({
          url: primary.imageUrl ?? primary.url ?? "",
          publicId: primary.imagePublicId ?? primary.publicId ?? "",
        })
      } else if (data.imageUrl && data.imagePublicId) {
        // Legacy single-image path
        if (existing.image?.path && existing.image.path !== data.imagePublicId) {
          await destroyCloudinaryImage(existing.image.path)
        }
        data.image = mapCloudinaryImage({ url: data.imageUrl, publicId: data.imagePublicId })
        data.images = [{ url: data.imageUrl, publicId: data.imagePublicId }]
      }
      delete data.imageUrl
      delete data.imagePublicId
      delete data.imagesData

      if (data.category === "null") data.category = null

      if ("isNew" in data) {
        data.isNewArrival = data.isNew
        delete data.isNew
      }

      data.updatedBy = req.loggedInUser?._id

      const gear = await GearModel.findOneAndUpdate({ slug: req.params.slug }, data, { new: true })
      if (!gear) throw { code: 404, message: "Gear not found" }

      res.json({ data: toPublicGear(gear), message: "Gear updated successfully", meta: null })
    } catch (exception) {
      next(exception)
    }
  }

  /** DELETE /api/v1/gear/:slug — admin */
  deleteGear = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const gear = await GearModel.findOneAndDelete({ slug: req.params.slug })
      if (!gear) throw { code: 404, message: "Gear not found" }

      // Destroy all images from the images array.
      if (Array.isArray(gear.images)) {
        for (const img of gear.images) {
          if (img.publicId) await destroyCloudinaryImage(img.publicId)
        }
      }
      // Also clean up the legacy image field if present and not already covered.
      if (gear.image?.path) {
        await destroyCloudinaryImage(gear.image.path)
      }

      res.json({ data: null, message: "Gear deleted successfully", meta: null })
    } catch (exception) {
      next(exception)
    }
  }
}

export default GearController
