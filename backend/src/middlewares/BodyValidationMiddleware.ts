import type { NextFunction, Request, Response } from "express"
import { z } from "zod"

/**
 * Higher-order middleware: bodyValidator(schema) → middleware.
 * Replaces req.body with the PARSED result (defaults/coercions applied)
 * and converts ZodError into a flat { field: message } map.
 */
const bodyValidator = (schema: z.ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body)
      next()
    } catch (exception) {
      if (exception instanceof z.ZodError) {
        const detail: Record<string, string> = {}
        exception.issues.forEach((issue) => {
          detail[issue.path.join(".") || "_form"] = issue.message
        })
        next({ code: 400, message: "Validation failed", detail })
      } else {
        next(exception)
      }
    }
  }
}

export default bodyValidator
