import axios from "axios"
import { z } from "zod"
import { api, ApiRequestError } from "@/lib/api"
import {
  cloudinaryUploadSchema,
  uploadSignatureSchema,
  videoSchema,
  type CloudinaryUpload,
  type UploadSignature,
  type Video,
} from "@/types"
import type { ListParams, Paged } from "@/api/shared"

/**
 * Video publishing is a three-step flow — the file never touches Express:
 *   1. POST /video/upload-signature   (server signs with the Cloudinary secret)
 *   2. browser uploads the file straight to Cloudinary with that signature
 *   3. POST /video                     (persist secure_url + public_id)
 */

/** GET /video?category=&page=&limit= */
export async function fetchVideoList(params: ListParams = {}, signal?: AbortSignal): Promise<Paged<Video>> {
  const res = await api.get("/video", z.array(videoSchema), { params, signal })
  return { rows: res.data, meta: res.meta }
}

/** Step 1 — POST /video/upload-signature (admin). */
export async function fetchUploadSignature(): Promise<UploadSignature> {
  const res = await api.post("/video/upload-signature", uploadSignatureSchema, {})
  return res.data
}

/** Cloudinary's own error body: { error: { message } }. */
const cloudinaryErrorSchema = z.object({
  error: z.object({ message: z.string() }),
})

/**
 * Step 2 — direct browser → Cloudinary upload.
 * Bare axios on purpose: a different host, no envelope, and our bearer token
 * must never be attached to a third-party request. The signed fields have to
 * match exactly what the server signed (timestamp + folder).
 */
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

/** Step 3 — POST /video (JSON). */
export async function createVideo(input: {
  title: string
  category: string
  cloudinaryUrl: string
  publicId: string
}): Promise<Video> {
  const res = await api.post("/video", videoSchema, input)
  return res.data
}

/** DELETE /video/:id — also destroys the Cloudinary asset server-side. */
export async function deleteVideo(id: string): Promise<string> {
  const res = await api.delete(`/video/${encodeURIComponent(id)}`, z.null())
  return res.message
}
