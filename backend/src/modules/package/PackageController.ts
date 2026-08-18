import type { NextFunction, Response } from "express"
import PackageModel from "./PackageModel"
import { getPagination, makeSlug } from "../../utilities/helpers"
import type { IAuthRequest } from "../auth/AuthContract"

class PackageController {
  /** POST /api/v1/package — admin */
  createPackage = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = req.body

      data.slug = makeSlug(data.name)
      if (await PackageModel.findOne({ slug: data.slug })) {
        data.slug = `${data.slug}-${Date.now()}`
      }

      data.createdBy = req.loggedInUser?._id
      data.updatedBy = req.loggedInUser?._id

      const pkg = new PackageModel(data)
      await pkg.save()

      res.json({ data: pkg, message: "Package created successfully", meta: null })
    } catch (exception) {
      next(exception)
    }
  }

  /** GET /api/v1/package — public */
  listAllPackages = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const { page, limit, skip } = getPagination(req.query as Record<string, unknown>)

      const filter: Record<string, unknown> = { status: "active" }
      if (req.query.search) filter.name = { $regex: String(req.query.search), $options: "i" }

      const [items, total] = await Promise.all([
        PackageModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        PackageModel.countDocuments(filter),
      ])

      res.json({ data: items, message: "Package list", meta: { page, limit, total } })
    } catch (exception) {
      next(exception)
    }
  }

  /** GET /api/v1/package/:slug — public */
  getPackageDetail = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const pkg = await PackageModel.findOne({ slug: req.params.slug })
      if (!pkg) throw { code: 404, message: "Package not found" }
      res.json({ data: pkg, message: "Package detail", meta: null })
    } catch (exception) {
      next(exception)
    }
  }

  /** PUT /api/v1/package/:slug — admin */
  updatePackage = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = req.body
      delete data.slug
      data.updatedBy = req.loggedInUser?._id

      const pkg = await PackageModel.findOneAndUpdate({ slug: req.params.slug }, data, { new: true })
      if (!pkg) throw { code: 404, message: "Package not found" }

      res.json({ data: pkg, message: "Package updated successfully", meta: null })
    } catch (exception) {
      next(exception)
    }
  }

  /** DELETE /api/v1/package/:slug — admin */
  deletePackage = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const pkg = await PackageModel.findOneAndDelete({ slug: req.params.slug })
      if (!pkg) throw { code: 404, message: "Package not found" }
      res.json({ data: null, message: "Package deleted successfully", meta: null })
    } catch (exception) {
      next(exception)
    }
  }
}

export default PackageController
