import type { NextFunction, Response } from "express"
import ContactModel from "./ContactModel"
import EmailService from "../../services/EmailService"
import { notifyEmail } from "../../config/smtpConfig"
import { getPagination } from "../../utilities/helpers"
import type { IAuthRequest } from "../auth/AuthContract"
import { loggerFor } from "../../config/logger"

const log = loggerFor("ContactController")

const emailService = new EmailService()

class ContactController {
  /** POST /api/v1/contact — public contact form */
  createContact = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const contact = new ContactModel(req.body)
      await contact.save()

      // Respond right away — message is already saved in DB, and the
      // visitor shouldn't sit waiting on SMTP.
      res.json({ data: { _id: contact._id }, message: "Message sent successfully. We will reach out soon!", meta: null })

      // Notify the shop inbox — non-critical side effect.
      emailService
        .sendEmail({
          to: notifyEmail,
          sub: `New enquiry: ${contact.subject}`,
          message: `<p><b>${contact.name}</b> (${contact.email}, ${contact.phone})</p><p>${contact.message}</p>`,
        })
        .catch((err) => {
          log.error({ err, to: notifyEmail }, "Contact notification email could not be sent — check email env vars")
        })
    } catch (exception) {
      next(exception)
    }
  }

  /** GET /api/v1/contact — admin inbox with pagination */
  listAllContacts = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const { page, limit, skip } = getPagination(req.query as Record<string, unknown>)

      const filter: Record<string, unknown> = {}
      if (req.query.status) filter.status = req.query.status
      if (req.query.search) filter.subject = { $regex: String(req.query.search), $options: "i" }

      const [items, total] = await Promise.all([
        ContactModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        ContactModel.countDocuments(filter),
      ])

      res.json({ data: items, message: "Contact list", meta: { page, limit, total } })
    } catch (exception) {
      next(exception)
    }
  }

  /** PATCH /api/v1/contact/:id/status — admin marks read/resolved */
  updateContactStatus = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const contact = await ContactModel.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status },
        { new: true },
      )
      if (!contact) throw { code: 404, message: "Contact not found" }

      res.json({ data: contact, message: "Contact status updated", meta: null })
    } catch (exception) {
      next(exception)
    }
  }

  /** DELETE /api/v1/contact/:id — admin */
  deleteContact = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const contact = await ContactModel.findByIdAndDelete(req.params.id)
      if (!contact) throw { code: 404, message: "Contact not found" }
      res.json({ data: null, message: "Contact deleted successfully", meta: null })
    } catch (exception) {
      next(exception)
    }
  }
}

export default ContactController
