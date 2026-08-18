import axios, { AxiosError } from "axios"
import { z } from "zod"
import { apiErrorSchema, envelopeSchema, type PaginationMeta } from "@/types"
import { refreshResponseSchema } from "@/types/auth"
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  notifySessionExpired,
  setTokens,
} from "@/lib/session"

/**
 * The single HTTP layer for the CMS — same pattern as the public site's
 * src/lib/api.ts: one axios instance, a request interceptor that attaches the
 * bearer token, every response parsed through the { data, message, meta }
 * envelope with Zod, and every failure normalized to ApiRequestError.
 *
 * VITE_API_BASE_URL must include the /api/v1 suffix. Left empty (dev) it falls
 * back to the relative "/api/v1", which the Vite proxy forwards to :9005.
 */
const BASE = import.meta.env.VITE_API_BASE_URL?.trim() || "/api/v1"

export class ApiRequestError extends Error {
  code: string
  status: number
  detail?: unknown

  constructor(status: number, code: string, message: string, detail?: unknown) {
    super(message)
    this.name = "ApiRequestError"
    this.status = status
    this.code = code
    this.detail = detail
  }

  /**
   * The backend's bodyValidator returns `detail` as a flat
   * { field: message } map — surface it for inline form errors.
   */
  get fieldErrors(): Record<string, string> {
    if (!this.detail || typeof this.detail !== "object" || Array.isArray(this.detail)) return {}
    const out: Record<string, string> = {}
    for (const [field, message] of Object.entries(this.detail as Record<string, unknown>)) {
      if (typeof message === "string") out[field] = message
    }
    return out
  }
}

export type QueryParams = Record<string, string | number | boolean | null | undefined>

export type ApiResponse<D> = {
  data: D
  message: string
  meta: PaginationMeta | null
}

type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE"

type RequestOptions = {
  body?: unknown
  params?: QueryParams
  signal?: AbortSignal
  /** Internal: set on the single post-refresh retry so we never loop. */
  skipAuthRetry?: boolean
}

const axiosInstance = axios.create({
  baseURL: BASE,
  headers: { Accept: "application/json" },
})

axiosInstance.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/** Drop empty values so we never send `?search=&category=`. */
function cleanParams(params?: QueryParams): Record<string, string> | undefined {
  if (!params) return undefined
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue
    out[key] = String(value)
  }
  return Object.keys(out).length ? out : undefined
}

/** Endpoints that must never trigger the refresh-and-retry dance. */
function isAuthEndpoint(path: string): boolean {
  return path.startsWith("/auth/login") || path.startsWith("/auth/refresh-token")
}

/* --- single-flight token refresh ------------------------------------- */

let refreshInFlight: Promise<boolean> | null = null

async function doRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false

  try {
    // Bare axios on purpose: no interceptor, no stale bearer, no recursion.
    const res = await axios.post(
      `${BASE}/auth/refresh-token`,
      { refreshToken },
      { headers: { Accept: "application/json" } },
    )
    const parsed = envelopeSchema(refreshResponseSchema).safeParse(res.data)
    if (!parsed.success) return false

    setTokens(parsed.data.data.accessToken, parsed.data.data.refreshToken)
    return true
  } catch {
    return false
  }
}

/** Concurrent 401s share one refresh attempt. */
function refreshOnce(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = doRefresh().finally(() => {
      refreshInFlight = null
    })
  }
  return refreshInFlight
}

/* --- the typed request wrapper --------------------------------------- */

async function request<T extends z.ZodTypeAny>(
  method: Method,
  path: string,
  dataSchema: T,
  options: RequestOptions = {},
): Promise<ApiResponse<z.infer<T>>> {
  try {
    const res = await axiosInstance.request({
      method,
      url: path,
      data: options.body,
      params: cleanParams(options.params),
      signal: options.signal,
    })

    const envelope = envelopeSchema(dataSchema).parse(res.data)
    return { data: envelope.data, message: envelope.message, meta: envelope.meta ?? null }
  } catch (error) {
    // The response arrived but did not match the contract.
    if (error instanceof z.ZodError) {
      throw new ApiRequestError(
        500,
        "INVALID_RESPONSE",
        "The server returned data in an unexpected format.",
        error.flatten(),
      )
    }

    // Aborted by the caller (component unmounted, filters changed) — not a failure.
    if (axios.isCancel(error)) {
      throw new ApiRequestError(0, "CANCELED", "Request canceled")
    }

    if (error instanceof AxiosError) {
      const status = error.response?.status ?? 0

      // Mid-session expiry: refresh once, replay once, otherwise log out.
      if (status === 401 && !options.skipAuthRetry && !isAuthEndpoint(path)) {
        const refreshed = await refreshOnce()
        if (refreshed) {
          return request(method, path, dataSchema, { ...options, skipAuthRetry: true })
        }
        clearSession()
        notifySessionExpired()
      }

      if (!error.response) {
        throw new ApiRequestError(
          0,
          "NETWORK_ERROR",
          "Cannot reach the API. Is the backend running on port 9005?",
        )
      }

      const parsed = apiErrorSchema.safeParse(error.response.data)
      if (parsed.success) {
        throw new ApiRequestError(status, parsed.data.code, parsed.data.message, parsed.data.detail)
      }
      throw new ApiRequestError(status, "UNKNOWN", `Request failed (${status})`)
    }

    throw error
  }
}

export const api = {
  get: <T extends z.ZodTypeAny>(path: string, schema: T, options?: RequestOptions) =>
    request("GET", path, schema, options),
  post: <T extends z.ZodTypeAny>(path: string, schema: T, body?: unknown, options?: RequestOptions) =>
    request("POST", path, schema, { ...options, body }),
  put: <T extends z.ZodTypeAny>(path: string, schema: T, body?: unknown, options?: RequestOptions) =>
    request("PUT", path, schema, { ...options, body }),
  patch: <T extends z.ZodTypeAny>(path: string, schema: T, body?: unknown, options?: RequestOptions) =>
    request("PATCH", path, schema, { ...options, body }),
  delete: <T extends z.ZodTypeAny>(path: string, schema: T, options?: RequestOptions) =>
    request("DELETE", path, schema, options),
}

/** True when a request was aborted on purpose — callers should stay quiet. */
export function isCanceled(error: unknown): boolean {
  return error instanceof ApiRequestError && error.code === "CANCELED"
}

/** Human-readable message for any thrown value — used by every toast. */
export function errorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (error instanceof ApiRequestError) return error.message
  if (error instanceof Error) return error.message
  return fallback
}
