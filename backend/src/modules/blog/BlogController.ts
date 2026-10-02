import type { NextFunction, Response } from "express"
import BlogModel from "./BlogModel"
import { destroyCloudinaryImage, getPagination, makeSlug, mapCloudinaryImage } from "../../utilities/helpers"
import type { IAuthRequest } from "../auth/AuthContract"
import { escapeRegex, getSearchTerm } from "../../utilities/query"

/** Serialize coverImage to the URL shape consumed by the public site and CMS. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toPublicBlog(doc: any) {
  const obj = typeof doc.toObject === "function" ? doc.toObject() : doc
  return {
    ...obj,
    coverImage: obj.coverImage?.url ?? "",
    metaTitle: obj.metaTitle || obj.title,
    metaDescription: obj.metaDescription || obj.excerpt,
  }
}

class BlogController {
  /** POST /api/v1/blog — admin (JSON, accepts coverImageUrl + coverImagePublicId). */
  createBlog = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = req.body
      data.slug = makeSlug(data.title)
      if (await BlogModel.findOne({ slug: data.slug })) data.slug = `${data.slug}-${Date.now()}`

      if (data.coverImageUrl && data.coverImagePublicId) {
        data.coverImage = mapCloudinaryImage({ url: data.coverImageUrl, publicId: data.coverImagePublicId })
      }
      delete data.coverImageUrl
      delete data.coverImagePublicId

      if (data.status === "active") data.publishedAt = new Date()
      data.createdBy = req.loggedInUser?._id
      data.updatedBy = req.loggedInUser?._id

      const blog = new BlogModel(data)
      await blog.save()

      res.json({ data: toPublicBlog(blog), message: "Blog post created successfully", meta: null })
    } catch (exception) {
      next(exception)
    }
  }

  /** GET /api/v1/blog — active posts publicly; admins may request all statuses. */
  listAllBlogs = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const { page, limit, skip } = getPagination(req.query as Record<string, unknown>)
      const requestedStatus = req.loggedInUser?.role === "admin" ? String(req.query.status ?? "active") : "active"
      const filter: Record<string, unknown> = {}
      if (requestedStatus !== "all") filter.status = requestedStatus

      const term = getSearchTerm(req.query as Record<string, unknown>)
      if (term) {
        const expression = { $regex: escapeRegex(term), $options: "i" }
        filter.$or = [{ title: expression }, { excerpt: expression }]
      }

      const [items, total] = await Promise.all([
        BlogModel.find(filter).sort({ publishedAt: -1, createdAt: -1 }).skip(skip).limit(limit),
        BlogModel.countDocuments(filter),
      ])

      res.json({
        data: items.map(toPublicBlog),
        message: "Blog list",
        meta: { page, limit, total },
      })
    } catch (exception) {
      next(exception)
    }
  }

  /** GET /api/v1/blog/:slug — active posts publicly; admins may edit drafts. */
  getBlogDetail = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const blog = await BlogModel.findOne({
        slug: req.params.slug,
        ...(req.loggedInUser?.role === "admin" ? {} : { status: "active" }),
      })
      if (!blog) throw { code: 404, message: "Blog post not found" }

      res.json({ data: toPublicBlog(blog), message: "Blog detail", meta: null })
    } catch (exception) {
      next(exception)
    }
  }

  /** PUT /api/v1/blog/:slug — admin. Slugs remain stable after creation. */
  updateBlog = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = req.body
      delete data.slug

      const existing = await BlogModel.findOne({ slug: req.params.slug })
      if (!existing) throw { code: 404, message: "Blog post not found" }

      if (data.coverImageUrl && data.coverImagePublicId) {
        if (existing.coverImage?.path && existing.coverImage.path !== data.coverImagePublicId) {
          await destroyCloudinaryImage(existing.coverImage.path)
        }
        data.coverImage = mapCloudinaryImage({ url: data.coverImageUrl, publicId: data.coverImagePublicId })
      }
      delete data.coverImageUrl
      delete data.coverImagePublicId

      if (data.status === "active" && existing.status !== "active" && !existing.publishedAt) {
        data.publishedAt = new Date()
      }
      if (data.status === "active" && !existing.publishedAt) data.publishedAt = new Date()
      data.updatedBy = req.loggedInUser?._id

      const blog = await BlogModel.findOneAndUpdate({ slug: req.params.slug }, data, { new: true })
      if (!blog) throw { code: 404, message: "Blog post not found" }

      res.json({ data: toPublicBlog(blog), message: "Blog post updated successfully", meta: null })
    } catch (exception) {
      next(exception)
    }
  }

  /** DELETE /api/v1/blog/:slug — admin; also cleans up the cover image. */
  deleteBlog = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const blog = await BlogModel.findOneAndDelete({ slug: req.params.slug })
      if (!blog) throw { code: 404, message: "Blog post not found" }
      if (blog.coverImage?.path) await destroyCloudinaryImage(blog.coverImage.path)

      res.json({ data: null, message: "Blog post deleted successfully", meta: null })
    } catch (exception) {
      next(exception)
    }
  }
}

export default BlogController
