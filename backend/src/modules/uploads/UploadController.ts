import type { NextFunction, Response } from "express"
import cloudinary from "../../config/cloudinaryConfig"
import { cloudinaryConfig } from "../../config/AppConfig"
import type { IAuthRequest } from "../auth/AuthContract"

export const IMAGE_UPLOAD_FOLDERS: Record<string, string> = {
  gear: "yatriko/images/gear",
  category: "yatriko/images/brands",
  categories: "yatriko/images/brands",
  destination: "yatriko/images/spots",
  destinations: "yatriko/images/spots",
  user: "yatriko/images/users",
  users: "yatriko/images/users",
  settings: "yatriko/images/settings",
}

class UploadController {
  /**
   * GET/POST /api/v1/uploads/sign?folder=gear
   * Generates a signed Cloudinary upload payload for direct browser-to-Cloudinary image upload.
   */
  getUploadSignature = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!cloudinaryConfig.cloudName || !cloudinaryConfig.apiSecret || !cloudinaryConfig.apiKey) {
        throw { code: 500, message: "Cloudinary is not configured on the server" }
      }

      const folderParam = (req.query.folder ?? req.body?.folder) as string | undefined
      if (!folderParam || !(folderParam in IMAGE_UPLOAD_FOLDERS)) {
        throw {
          code: 400,
          message: "Invalid or missing upload folder. Allowed: gear, category, destination, user, settings",
        }
      }

      // Non-admins can only sign user avatar uploads
      if (req.loggedInUser?.role !== "admin" && folderParam !== "user" && folderParam !== "users") {
        throw { code: 403, message: "Only admins can upload images to this folder" }
      }

      const targetFolder = IMAGE_UPLOAD_FOLDERS[folderParam]
      const timestamp = Math.round(Date.now() / 1000)
      const paramsToSign = { timestamp, folder: targetFolder }
      const signature = cloudinary.utils.api_sign_request(paramsToSign, cloudinaryConfig.apiSecret)

      res.json({
        data: {
          cloudName: cloudinaryConfig.cloudName,
          apiKey: cloudinaryConfig.apiKey,
          timestamp,
          folder: targetFolder,
          signature,
          uploadUrl: `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
        },
        message: "Upload signature generated",
        meta: null,
      })
    } catch (exception) {
      next(exception)
    }
  }
}

export default UploadController
