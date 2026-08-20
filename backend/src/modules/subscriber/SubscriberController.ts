import type { NextFunction, Response } from "express"
import SubscriberModel from "./SubscriberModel"
import EmailService from "../../services/EmailService"
import { getPagination } from "../../utilities/helpers"
import type { IAuthRequest } from "../auth/AuthContract"
import { loggerFor } from "../../config/logger"

const log = loggerFor("SubscriberController")

const emailService = new EmailService()

class SubscriberController {
  /** POST /api/v1/subscriber — public (lead-capture modal) */
  createSubscriber = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const { email, source } = req.body

      // Idempotent: re-subscribing the same email is not an error.
      const existing = await SubscriberModel.findOne({ email })
      if (existing) {
        res.json({ data: { _id: existing._id }, message: "You are already on the list!", meta: null })
        return
      }

      const subscriber = new SubscriberModel({ email, source })
      await subscriber.save()

      // Non-critical welcome/offer email.
      try {
        await emailService.sendEmail({
          to: email,
          sub: "Your 15% off Yatriko Gears rentals \ud83c\udfd5\ufe0f",
          message:
            "<h2>Namaste!</h2><p>Show this email to claim <b>15% off</b> your first rental. Gear up. Head out. Make memories.</p>",
        })
      } catch {
        log.error("Subscriber offer email could not be sent")
      }

      res.json({ data: { _id: subscriber._id }, message: "Offer claimed! Check your inbox.", meta: null })
    } catch (exception) {
      next(exception)
    }
  }

  /** GET /api/v1/subscriber — admin list */
  listAllSubscribers = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const { page, limit, skip } = getPagination(req.query as Record<string, unknown>)

      const filter: Record<string, unknown> = {}
      if (req.query.search) filter.email = { $regex: String(req.query.search), $options: "i" }

      const [items, total] = await Promise.all([
        SubscriberModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        SubscriberModel.countDocuments(filter),
      ])

      res.json({ data: items, message: "Subscriber list", meta: { page, limit, total } })
    } catch (exception) {
      next(exception)
    }
  }

  /** DELETE /api/v1/subscriber/:id — admin */
  deleteSubscriber = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const subscriber = await SubscriberModel.findByIdAndDelete(req.params.id)
      if (!subscriber) throw { code: 404, message: "Subscriber not found" }
      res.json({ data: null, message: "Subscriber deleted successfully", meta: null })
    } catch (exception) {
      next(exception)
    }
  }
}

export default SubscriberController
