import type { NextFunction, Response } from "express"
import DestinationModel from "./DestinationModel"
import { getPagination, makeSlug, mapImage } from "../../utilities/helpers"
import type { IAuthRequest } from "../auth/AuthContract"

/** Serialize: image sub-doc → plain URL string (frontend destinationSchema). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toPublicDestination(doc: any) {
  const obj = typeof doc.toObject === "function" ? doc.toObject() : doc
  return { ...obj, image: obj.image?.url ?? "" }
}

class DestinationController {
  /** POST /api/v1/destination — admin (multipart, field name: image) */
  createDestination = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = req.body

      data.slug = makeSlug(data.name)
      if (await DestinationModel.findOne({ slug: data.slug })) {
        data.slug = `${data.slug}-${Date.now()}`
      }

      if (req.file) data.image = mapImage(req.file as Express.Multer.File, "destination/")

      data.createdBy = req.loggedInUser?._id
      data.updatedBy = req.loggedInUser?._id

      const destination = new DestinationModel(data)
      await destination.save()

      res.json({ data: toPublicDestination(destination), message: "Destination created successfully", meta: null })
    } catch (exception) {
      next(exception)
    }
  }

  /** GET /api/v1/destination — public */
  listAllDestinations = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const { page, limit, skip } = getPagination(req.query as Record<string, unknown>)

      const filter: Record<string, unknown> = { status: "active" }
      if (req.query.search) filter.name = { $regex: String(req.query.search), $options: "i" }

      const [items, total] = await Promise.all([
        DestinationModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        DestinationModel.countDocuments(filter),
      ])

      res.json({
        data: items.map(toPublicDestination),
        message: "Destination list",
        meta: { page, limit, total },
      })
    } catch (exception) {
      next(exception)
    }
  }

  /** GET /api/v1/destination/:slug — public */
  getDestinationDetail = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const destination = await DestinationModel.findOne({ slug: req.params.slug })
      if (!destination) throw { code: 404, message: "Destination not found" }
      res.json({ data: toPublicDestination(destination), message: "Destination detail", meta: null })
    } catch (exception) {
      next(exception)
    }
  }

  /** PUT /api/v1/destination/:slug — admin */
  updateDestination = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = req.body
      delete data.slug

      if (req.file) data.image = mapImage(req.file as Express.Multer.File, "destination/")
      data.updatedBy = req.loggedInUser?._id

      const destination = await DestinationModel.findOneAndUpdate({ slug: req.params.slug }, data, { new: true })
      if (!destination) throw { code: 404, message: "Destination not found" }

      res.json({ data: toPublicDestination(destination), message: "Destination updated successfully", meta: null })
    } catch (exception) {
      next(exception)
    }
  }

  /** DELETE /api/v1/destination/:slug — admin */
  deleteDestination = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const destination = await DestinationModel.findOneAndDelete({ slug: req.params.slug })
      if (!destination) throw { code: 404, message: "Destination not found" }
      res.json({ data: null, message: "Destination deleted successfully", meta: null })
    } catch (exception) {
      next(exception)
    }
  }
}

export default DestinationController
