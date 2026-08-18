import type { NextFunction, Request, Response } from "express"

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
  let statusCode = 500
  let code = "INTERNAL_ERROR"
  let message = "Internal Server Error"
  let detail: unknown = null

  if (error instanceof Error) {
    statusCode = 400
    code = "BAD_REQUEST"
    message = error.message // e.g. multer "File format not supported"
  } else {
    statusCode = error.code ?? 500
    code = statusCode === 404 ? "NOT_FOUND" : statusCode >= 500 ? "INTERNAL_ERROR" : "BAD_REQUEST"
    message = error.message ?? "Internal Server Error"
    detail = error.detail ?? null
  }

  res.status(statusCode).json({ code, message, detail })
}

export default ErrorHandlingMiddleware
