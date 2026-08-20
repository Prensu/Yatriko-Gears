import type { NextFunction, Response } from "express"
import GearModel from "./GearModel"
import CategoryModel from "../category/CategoryModel"
import { getPagination, makeSlug, mapImage } from "../../utilities/helpers"
import type { IAuthRequest } from "../auth/AuthContract"

/**
 * Serialize a gear document into the shape the frontend's gearSchema expects:
 * image → plain URL string, isNewArrival → isNew.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toPublicGear(doc: any) {
  // flattenMaps: without it the `specs` Map serializes to {} and the CMS
  // editor looks like it never saved anything.
  const obj = typeof doc.toObject === "function" ? doc.toObject({ flattenMaps: true }) : doc
  return {
    ...obj,
    image: obj.image?.url ?? "",
    isNew: Boolean(obj.isNewArrival),
    specs: obj.specs ?? {},
  }
}

class GearController {
  /** POST /api/v1/gear — admin (multipart, field name: image) */
  createGear = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = req.body

      data.slug = makeSlug(data.name)
      if (await GearModel.findOne({ slug: data.slug })) {
        data.slug = `${data.slug}-${Date.now()}`
      }

      if (req.file) data.image = mapImage(req.file as Express.Multer.File, "gear/")

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

      if (req.file) data.image = mapImage(req.file as Express.Multer.File, "gear/")
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
      res.json({ data: null, message: "Gear deleted successfully", meta: null })
    } catch (exception) {
      next(exception)
    }
  }
}

export default GearController
