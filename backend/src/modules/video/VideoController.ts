import type { NextFunction, Response } from "express"
import cloudinary from "../../config/cloudinaryConfig"
import { cloudinaryConfig } from "../../config/AppConfig"
import VideoModel from "./VideoModel"
import { getPagination } from "../../utilities/helpers"
import type { IAuthRequest } from "../auth/AuthContract"

class VideoController {
  /**
   * POST /api/v1/video/upload-signature — admin.
   * Returns a short-lived signature so the CMS browser can upload the video
   * file DIRECTLY to Cloudinary without the API secret ever leaving the server.
   */
  getUploadSignature = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!cloudinaryConfig.cloudName || !cloudinaryConfig.apiSecret) {
        throw { code: 500, message: "Cloudinary is not configured on the server" }
      }

      const timestamp = Math.round(Date.now() / 1000)
      const paramsToSign = { timestamp, folder: cloudinaryConfig.videoFolder }
      const signature = cloudinary.utils.api_sign_request(paramsToSign, cloudinaryConfig.apiSecret)

      res.json({
        data: {
          cloudName: cloudinaryConfig.cloudName,
          apiKey: cloudinaryConfig.apiKey,
          timestamp,
          folder: cloudinaryConfig.videoFolder,
          signature,
          uploadUrl: "https://api.cloudinary.com/v1_1/" + cloudinaryConfig.cloudName + "/video/upload",
        },
        message: "Upload signature generated",
        meta: null,
      })
    } catch (exception) {
      next(exception)
    }
  }

  /** POST /api/v1/video — admin registers an uploaded Cloudinary video */
  createVideo = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = req.body
      data.createdBy = req.loggedInUser?._id
      data.updatedBy = req.loggedInUser?._id

      const video = new VideoModel(data)
      await video.save()

      res.json({ data: video, message: "Video added successfully", meta: null })
    } catch (exception) {
      next(exception)
    }
  }

  /** GET /api/v1/video — public portfolio list */
  listAllVideos = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const { page, limit, skip } = getPagination({ ...req.query, limit: req.query.limit ?? 50 })

      const filter: Record<string, unknown> = { status: "active" }
      if (req.query.category && req.query.category !== "All") filter.category = req.query.category

      const [items, total] = await Promise.all([
        VideoModel.find(filter).sort({ order: 1, createdAt: -1 }).skip(skip).limit(limit),
        VideoModel.countDocuments(filter),
      ])

      res.json({ data: items, message: "Video list", meta: { page, limit, total } })
    } catch (exception) {
      next(exception)
    }
  }

  /** PUT /api/v1/video/:id — admin */
  updateVideo = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = req.body
      data.updatedBy = req.loggedInUser?._id

      const video = await VideoModel.findByIdAndUpdate(req.params.id, data, { new: true })
      if (!video) throw { code: 404, message: "Video not found" }

      res.json({ data: video, message: "Video updated successfully", meta: null })
    } catch (exception) {
      next(exception)
    }
  }

  /** DELETE /api/v1/video/:id — admin; also destroys the Cloudinary asset */
  deleteVideo = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const video = await VideoModel.findByIdAndDelete(req.params.id)
      if (!video) throw { code: 404, message: "Video not found" }

      // Non-critical: don't fail the request if Cloudinary cleanup fails.
      try {
        await cloudinary.uploader.destroy(video.publicId, { resource_type: "video" })
      } catch {
        console.error(`Cloudinary asset could not be destroyed: ${video.publicId}`)
      }

      res.json({ data: null, message: "Video deleted successfully", meta: null })
    } catch (exception) {
      next(exception)
    }
  }
}

export default VideoController
