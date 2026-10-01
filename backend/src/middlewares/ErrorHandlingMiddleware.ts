import type { NextFunction, Request, Response } from "express"
import { loggerFor } from "../config/logger"

export type AppError = { code?: number; message?: string; detail?: unknown }

/**
 * Single 4-argument error middleware, registered LAST in app.ts.
 * Express identifies error middleware by its four parameters.
 *
 * Response shape follows what the frontend apiErrorSchema expects:
 *   { code: string, message: string, detail?: unknown }
 */
const ErrorHandlingMiddleware = (
  error: AppError | Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
) => {
  const statusCode = error instanceof Error ? 400 : error.code ?? 500
  const code = error instanceof Error
    ? "BAD_REQUEST"
    : statusCode === 404
      ? "NOT_FOUND"
      : statusCode >= 500
        ? "INTERNAL_ERROR"
        : "BAD_REQUEST"
  const message = error instanceof Error ? error.message : error.message ?? "Internal Server Error"
  const detail: unknown = error instanceof Error ? null : error.detail ?? null

  /**
   * Log before responding. 5xx means we broke something and it carries a
   * stack; 4xx is usually the caller's problem so it stays at warn and
   * doesn't page anyone.
   */
  const log = loggerFor("error-handler")
  const context = {
    reqId: (req as Request & { id?: string }).id,
    method: req.method,
    url: req.originalUrl,
    statusCode,
    code,
  }

  if (statusCode >= 500) {
    log.error({ ...context, err: error instanceof Error ? error : undefined, detail }, message)
  } else {
    log.warn(context, message)
  }

  res.status(statusCode).json({ code, message, detail })
}

export default ErrorHandlingMiddleware
