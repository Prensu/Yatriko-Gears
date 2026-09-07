import axios from "axios"
import { z } from "zod"
import { api, ApiRequestError } from "@/lib/api"
import {
  cloudinaryUploadSchema,
  uploadSignatureSchema,
  type CloudinaryUpload,
  type UploadSignature,
} from "@/types"

export type UploadFolder = "gear" | "category" | "destination" | "user" | "settings"

/** Cloudinary's own error body: { error: { message } }. */
const cloudinaryErrorSchema = z.object({
  error: z.object({ message: z.string() }),
})

/** Fetch signed upload parameters for a specific folder from the backend. */
export async function fetchImageUploadSignature(
  folder: UploadFolder,
  signal?: AbortSignal,
): Promise<UploadSignature> {
  const res = await api.get(`/uploads/sign?folder=${encodeURIComponent(folder)}`, uploadSignatureSchema, {
    signal,
  })
  return res.data
}

/** Direct browser → Cloudinary upload with signed payload. */
export async function uploadToCloudinary(
  signature: UploadSignature,
  file: File,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal,
): Promise<CloudinaryUpload> {
  const form = new FormData()
  form.append("file", file)
  form.append("api_key", signature.apiKey)
  form.append("timestamp", String(signature.timestamp))
  form.append("folder", signature.folder)
  form.append("signature", signature.signature)

  try {
    const res = await axios.post(signature.uploadUrl, form, {
      signal,
      onUploadProgress: (event) => {
        if (!onProgress) return
        const total = event.total ?? file.size
        if (!total) return
        onProgress(Math.min(99, Math.round((event.loaded * 100) / total)))
      },
    })
    return cloudinaryUploadSchema.parse(res.data)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const parsed = cloudinaryErrorSchema.safeParse(error.response?.data)
      throw new ApiRequestError(
        error.response?.status ?? 0,
        "CLOUDINARY_ERROR",
        parsed.success ? parsed.data.error.message : "Cloudinary rejected the upload",
      )
    }
    if (error instanceof z.ZodError) {
      throw new ApiRequestError(500, "CLOUDINARY_ERROR", "Cloudinary returned an unexpected response")
    }
    throw error
  }
}

/**
 * Convenience helper: fetch signature for the target folder and upload directly to Cloudinary.
 * Returns the secure URL and public ID to be sent to the backend.
 */
export async function uploadImage(
  folder: UploadFolder,
  file: File,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal,
): Promise<{ imageUrl: string; imagePublicId: string }> {
  const signature = await fetchImageUploadSignature(folder, signal)
  const uploaded = await uploadToCloudinary(signature, file, onProgress, signal)
  return {
    imageUrl: uploaded.secure_url,
    imagePublicId: uploaded.public_id,
  }
}
