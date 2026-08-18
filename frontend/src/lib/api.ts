import axios, { AxiosError } from "axios"
import { z } from "zod"
import { apiErrorSchema, envelopeSchema } from "@/types"

const BASE = (import.meta.env.VITE_API_BASE_URL ?? "") + "/api/v1"

export class ApiRequestError extends Error {
  code: string
  status: number
  detail?: unknown
  constructor(status: number, code: string, message: string, detail?: unknown) {
    super(message)
    this.status = status
    this.code = code
    this.detail = detail
  }
}

type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE"

const axiosInstance = axios.create({
  baseURL: BASE,
  headers: {
    Accept: "application/json",
  },
})

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("yatriko.accessToken")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/**
 * Typed fetch/axios wrapper for the Yatriko backend.
 * - Unwraps the { data, message, meta } envelope.
 * - Validates payloads with Zod before returning.
 * - Attaches the JWT access token when present (for the future admin CMS).
 */
async function request<T extends z.ZodTypeAny>(
  method: Method,
  path: string,
  dataSchema: T,
  body?: unknown,
): Promise<{ data: z.infer<T>; message: string; meta?: unknown }> {
  try {
    const res = await axiosInstance.request({
      method,
      url: path,
      data: body,
    })

    const envelope = envelopeSchema(dataSchema).parse(res.data)
    return { data: envelope.data, message: envelope.message, meta: envelope.meta ?? undefined }
  } catch (error) {
    if (error instanceof AxiosError) {
      const status = error.response?.status ?? 500
      const responseData = error.response?.data

      const parsed = apiErrorSchema.safeParse(responseData)
      if (parsed.success) {
        throw new ApiRequestError(status, parsed.data.code, parsed.data.message, parsed.data.detail)
      }
      throw new ApiRequestError(status, "UNKNOWN", `Request failed (${status})`)
    }
    throw error
  }
}

export const api = {
  get: <T extends z.ZodTypeAny>(path: string, schema: T) => request("GET", path, schema),
  post: <T extends z.ZodTypeAny>(path: string, schema: T, body: unknown) =>
    request("POST", path, schema, body),
  patch: <T extends z.ZodTypeAny>(path: string, schema: T, body: unknown) =>
    request("PATCH", path, schema, body),
  delete: <T extends z.ZodTypeAny>(path: string, schema: T) => request("DELETE", path, schema),
}
