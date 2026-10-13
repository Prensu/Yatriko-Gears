import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios"
import { z } from "zod"
import { config } from "@/config"
import { apiErrorSchema, envelopeSchema } from "@/types"
import { clearSession, getAccessToken, getRefreshToken, saveTokens } from "@/lib/session"

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
}

type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE"

/**
 * 60s because the free Render instance can take ~50s to wake up; a shorter
 * timeout would turn the first request after idle into a false failure.
 */
const axiosInstance = axios.create({
  baseURL: config.apiUrl,
  timeout: 60_000,
  headers: { Accept: "application/json" },
})

/* ------------------------------------------------------------------ */
/* Auth header + silent refresh                                         */
/* ------------------------------------------------------------------ */

axiosInstance.interceptors.request.use((req) => {
  const token = getAccessToken()
  if (token) req.headers.Authorization = `Bearer ${token}`
  return req
})

/** AuthContext registers this so a dead session flips the UI to "guest". */
let onSessionExpired: (() => void) | null = null
export function setSessionExpiredHandler(handler: (() => void) | null): void {
  onSessionExpired = handler
}

const NO_REFRESH_PATHS = ["/auth/login", "/auth/register", "/auth/google", "/auth/refresh-token"]

const refreshResponseSchema = envelopeSchema(
  z.object({ accessToken: z.string(), refreshToken: z.string() }),
)

/** One refresh at a time: parallel 401s all wait for the same request. */
let refreshInFlight: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null
  try {
    // Plain axios (no interceptors) so a failing refresh cannot loop.
    const res = await axios.post(
      `${config.apiUrl}/auth/refresh-token`,
      { refreshToken },
      { timeout: 60_000, headers: { Accept: "application/json" } },
    )
    const parsed = refreshResponseSchema.parse(res.data)
    // The backend rotates the refresh token, so store the new one.
    await saveTokens(parsed.data.accessToken, parsed.data.refreshToken)
    return parsed.data.accessToken
  } catch (error) {
    // Only a definite rejection ends the session. A flaky network must not log people out.
    if (error instanceof AxiosError && error.response && [400, 401, 403].includes(error.response.status)) {
      await clearSession()
      onSessionExpired?.()
    }
    return null
  }
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!(error instanceof AxiosError) || error.response?.status !== 401 || !error.config) {
      throw error
    }
    const original = error.config as InternalAxiosRequestConfig & { _retried?: boolean }
    const url = original.url ?? ""
    if (original._retried || NO_REFRESH_PATHS.some((p) => url.startsWith(p))) throw error
    if (!getRefreshToken()) throw error

    original._retried = true
    refreshInFlight ??= refreshAccessToken().finally(() => {
      refreshInFlight = null
    })
    const newToken = await refreshInFlight
    if (!newToken) throw error

    original.headers.Authorization = `Bearer ${newToken}`
    return axiosInstance.request(original)
  },
)

/* ------------------------------------------------------------------ */
/* Typed request: unwrap { data, message, meta } and validate with Zod  */
/* ------------------------------------------------------------------ */

async function request<T extends z.ZodTypeAny>(
  method: Method,
  path: string,
  dataSchema: T,
  body?: unknown,
): Promise<{ data: z.infer<T>; message: string; meta?: unknown }> {
  try {
    const res = await axiosInstance.request({ method, url: path, data: body })
    const envelope = envelopeSchema(dataSchema).parse(res.data)
    return { data: envelope.data, message: envelope.message, meta: envelope.meta ?? undefined }
  } catch (error) {
    if (error instanceof AxiosError) {
      if (!error.response) {
        const timedOut = error.code === "ECONNABORTED"
        throw new ApiRequestError(
          0,
          timedOut ? "TIMEOUT" : "NETWORK",
          timedOut
            ? "The server took too long to respond. Please try again."
            : "Can't reach the server. Check your internet connection and try again.",
        )
      }
      const status = error.response.status
      const body: unknown = error.response.data
      const parsed = apiErrorSchema.safeParse(body)
      if (parsed.success) {
        throw new ApiRequestError(status, parsed.data.code, parsed.data.message, parsed.data.detail)
      }
      // Rate limiters answer with { data, message, meta } and no `code`.
      const message =
        typeof body === "object" && body !== null && typeof (body as { message?: unknown }).message === "string"
          ? (body as { message: string }).message
          : `Request failed (${status})`
      throw new ApiRequestError(status, "UNKNOWN", message)
    }
    throw error
  }
}

export const api = {
  get: <T extends z.ZodTypeAny>(path: string, schema: T) => request("GET", path, schema),
  post: <T extends z.ZodTypeAny>(path: string, schema: T, body: unknown) => request("POST", path, schema, body),
  patch: <T extends z.ZodTypeAny>(path: string, schema: T, body: unknown) => request("PATCH", path, schema, body),
  delete: <T extends z.ZodTypeAny>(path: string, schema: T) => request("DELETE", path, schema),
}

/** Human-friendly message for any thrown value, for toasts and error states. */
export function errorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (error instanceof ApiRequestError) return error.message
  if (error instanceof z.ZodError) return "The server sent data the app did not expect. Please update the app."
  if (error instanceof Error && error.message) return error.message
  return fallback
}
