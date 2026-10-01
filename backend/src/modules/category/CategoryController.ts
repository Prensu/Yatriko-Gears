import type { NextFunction, Response } from "express"
import CategoryModel from "./CategoryModel"
import { destroyCloudinaryImage, getPagination, makeSlug, mapCloudinaryImage } from "../../utilities/helpers"
import type { IAuthRequest } from "../auth/AuthContract"
import { isOwnCloudinaryUrl } from "../../utilities/cloudinaryGuard"
import { escapeRegex, getSearchTerm, getStringParam } from "../../utilities/query"

class CategoryController {
  /** POST /api/v1/category — admin */
  createCategory = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = req.body

      data.slug = makeSlug(data.name)
      if (await CategoryModel.findOne({ slug: data.slug })) {
        data.slug = `${data.slug}-${Date.now()}`
      }

      if (data.imageUrl && data.imagePublicId) {
        if (!isOwnCloudinaryUrl(data.imageUrl)) throw { code: 400, message: "Invalid image" }
        data.image = mapCloudinaryImage({ url: data.imageUrl, publicId: data.imagePublicId })
      }
      delete data.imageUrl
      delete data.imagePublicId

      data.createdBy = req.loggedInUser?._id
      data.updatedBy = req.loggedInUser?._id

      const category = new CategoryModel(data)
      await category.save()

      res.json({ data: category, message: "Category created successfully", meta: null })
    } catch (exception) {
      next(exception)
    }
  }

  /** GET /api/v1/category — public */
  listAllCategory = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const { page, limit, skip } = getPagination(req.query as Record<string, unknown>)

      const filter: Record<string, unknown> = {}
      if (req.loggedInUser?.role === "admin") { const status = getStringParam(req.query as Record<string, unknown>, "status"); if (status && status !== "all") filter.status = status } else filter.status = "active"
      const term = getSearchTerm(req.query as Record<string, unknown>); if (term) filter.name = { $regex: escapeRegex(term), $options: "i" }

      const [items, total] = await Promise.all([
        CategoryModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        CategoryModel.countDocuments(filter),
      ])

      res.json({ data: items, message: "Category list", meta: { page, limit, total } })
    } catch (exception) {
      next(exception)
    }
  }

  /** GET /api/v1/category/:slug — public */
  getCategoryDetail = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const category = await CategoryModel.findOne({ slug: req.params.slug, ...(req.loggedInUser?.role === "admin" ? {} : { status: "active" }) })
      if (!category) throw { code: 404, message: "Category not found" }
      res.json({ data: category, message: "Category detail", meta: null })
    } catch (exception) {
      next(exception)
    }
  }

  /** PUT /api/v1/category/:slug — admin */
  updateCategory = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = req.body
      delete data.slug // slug stays stable so existing URLs don't break

      const existing = await CategoryModel.findOne({ slug: req.params.slug })
      if (!existing) throw { code: 404, message: "Category not found" }

      if (data.imageUrl && data.imagePublicId) {
        if (!isOwnCloudinaryUrl(data.imageUrl)) throw { code: 400, message: "Invalid image" }
        if (existing.image?.path && existing.image.path !== data.imagePublicId) {
          await destroyCloudinaryImage(existing.image.path)
        }
        data.image = mapCloudinaryImage({ url: data.imageUrl, publicId: data.imagePublicId })
      }
      delete data.imageUrl
      delete data.imagePublicId

      data.updatedBy = req.loggedInUser?._id

      const category = await CategoryModel.findOneAndUpdate({ slug: req.params.slug }, data, { new: true })
      if (!category) throw { code: 404, message: "Category not found" }

      res.json({ data: category, message: "Category updated successfully", meta: null })
    } catch (exception) {
      next(exception)
    }
  }

  /** DELETE /api/v1/category/:slug — admin */
  deleteCategory = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const category = await CategoryModel.findOneAndDelete({ slug: req.params.slug })
      if (!category) throw { code: 404, message: "Category not found" }

      if (category.image?.path) {
        await destroyCloudinaryImage(category.image.path)
      }

      res.json({ data: null, message: "Category deleted successfully", meta: null })
    } catch (exception) {
      next(exception)
    }
  }
}

export default CategoryController
