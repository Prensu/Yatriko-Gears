import type { NextFunction, Response } from "express"
import BookingModel from "./BookingModel"
import GearModel from "../gear/GearModel"
import { assertAvailable, getAvailability } from "./AvailabilityService"
import { DELIVERY_CHARGE, calculateSubtotal, calculateTotal, countDays } from "./BookingPricing"
import EmailService from "../../services/EmailService"
import { smtpConfig } from "../../config/AppConfig"
import { getPagination } from "../../utilities/helpers"
import type { IAuthRequest } from "../auth/AuthContract"
import { loggerFor } from "../../config/logger"

const log = loggerFor("BookingController")

const emailService = new EmailService()

/** YG-250819-4F2A — short enough to read out on the phone. */
function makeBookingCode(): string {
  const stamp = new Date().toISOString().slice(2, 10).replace(/-/g, "")
  const random = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `YG-${stamp}-${random}`
}

class BookingController {
  /**
   * POST /api/v1/booking — customer creates a rental booking.
   * Prices come from the DATABASE, never from the request body: the client
   * only says which gear and how many.
   */
  createBooking = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = req.body
      const user = req.loggedInUser
      if (!user?._id) throw { code: 401, message: "Unauthorized" }

      const startDate = new Date(body.startDate)
      const endDate = new Date(body.endDate)

      // Don't let people book yesterday.
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (startDate < today) throw { code: 400, message: "Pickup date cannot be in the past" }

      const days = countDays(startDate, endDate)

      const gearIds = body.items.map((item: { gear: string }) => item.gear)
      const gearDocs = await GearModel.find({ _id: { $in: gearIds }, status: "active" })
      if (gearDocs.length !== gearIds.length) {
        throw { code: 422, message: "One or more items are no longer available" }
      }

      const items = body.items.map((item: { gear: string; quantity: number }) => {
        const gear = gearDocs.find((doc) => String(doc._id) === item.gear)
        if (!gear) throw { code: 422, message: "Gear not found" }
        return {
          gear: gear._id,
          name: gear.name,
          // The discounted price is what the site advertises, so charge that.
          pricePerDay: gear.discountedPrice,
          quantity: item.quantity,
        }
      })

      // Stock gate: refuse before we create anything, so two customers can't
      // both walk away thinking they have the same tent.
      await assertAvailable(
        items.map((item: { gear: unknown; quantity: number }) => ({
          gear: String(item.gear),
          quantity: item.quantity,
        })),
        startDate,
        endDate,
      )

      const subtotal = calculateSubtotal(items, days)
      const total = calculateTotal(subtotal)

      const booking = new BookingModel({
        code: makeBookingCode(),
        user: user._id,
        customerName: user.name,
        customerEmail: user.email,
        customerPhone: body.phone,
        deliveryAddress: body.deliveryAddress,
        note: body.note,
        items,
        startDate,
        endDate,
        days,
        subtotal,
        deliveryCharge: DELIVERY_CHARGE,
        total,
        paymentMethod: body.paymentMethod,
        // Cash bookings are unpaid until the gear changes hands.
        paymentStatus: "unpaid",
      })
      await booking.save()

      const itemLines = items
        .map(
          (item: { name: string; quantity: number; pricePerDay: number }) =>
            `<li>${item.name} &times; ${item.quantity} — Rs. ${item.pricePerDay}/day</li>`,
        )
        .join("")
      const dateRange = `${body.startDate} to ${body.endDate}`

      // Both emails are non-critical: the booking stands even if SMTP is down.
      try {
        await emailService.sendEmail({
          to: smtpConfig.fromAddress,
          sub: `New booking ${booking.code}`,
          message: `<p><b>${booking.customerName}</b> (${booking.customerPhone}) booked ${items.length} item(s) for ${days} day(s).</p><ul>${itemLines}</ul><p>Deliver to: ${booking.deliveryAddress}</p><p>Total: Rs. ${total}</p>`,
        })
      } catch {
        log.error("Booking notification email could not be sent")
      }

      // The customer gets a receipt too — previously only the shop was told.
      try {
        await emailService.sendEmail({
          to: booking.customerEmail,
          sub: `Your Yatriko Gears booking ${booking.code}`,
          message: `<h2>Namaste ${booking.customerName}!</h2>
            <p>We have your booking <b>${booking.code}</b>. Our team will call you on
            ${booking.customerPhone} to confirm delivery.</p>
            <ul>${itemLines}</ul>
            <p><b>Rental dates:</b> ${dateRange} (${days} day${days > 1 ? "s" : ""})<br/>
            <b>Deliver to:</b> ${booking.deliveryAddress}<br/>
            <b>Total:</b> Rs. ${total} — ${
              body.paymentMethod === "cash" ? "payable on delivery" : "pay online with eSewa"
            }</p>
            <p>Gear up. Head out. Make memories. \u26fa</p>`,
        })
      } catch {
        log.error("Booking receipt email could not be sent")
      }

      res.json({ data: booking, message: "Booking created successfully", meta: null })
    } catch (exception) {
      next(exception)
    }
  }

  /**
   * GET /api/v1/booking/availability?gear=<id>&startDate=&endDate=
   * Public: lets the booking form show "3 available" before anyone commits.
   */
  checkAvailability = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const gearId = String(req.query.gear ?? "")
      const startDate = new Date(String(req.query.startDate ?? ""))
      const endDate = new Date(String(req.query.endDate ?? ""))

      if (!gearId) throw { code: 400, message: "gear is compulsory" }
      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        throw { code: 400, message: "Valid startDate and endDate are compulsory" }
      }
      if (endDate < startDate) {
        throw { code: 400, message: "Return date cannot be before the pickup date" }
      }

      const availability = await getAvailability([gearId], startDate, endDate)
      const info = availability.get(gearId)
      if (!info) throw { code: 404, message: "Gear not found" }

      res.json({ data: info, message: "Availability", meta: null })
    } catch (exception) {
      next(exception)
    }
  }

  /** GET /api/v1/booking/my — the logged-in customer's own bookings. */
  myBookings = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const { page, limit, skip } = getPagination(req.query as Record<string, unknown>)
      const filter = { user: req.loggedInUser?._id }

      const [items, total] = await Promise.all([
        BookingModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        BookingModel.countDocuments(filter),
      ])

      res.json({ data: items, message: "Booking list", meta: { page, limit, total } })
    } catch (exception) {
      next(exception)
    }
  }

  /** GET /api/v1/booking/:id — owner or admin only. */
  getBookingDetail = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const booking = await BookingModel.findById(req.params.id)
      if (!booking) throw { code: 404, message: "Booking not found" }

      const isOwner = String(booking.user) === String(req.loggedInUser?._id)
      if (!isOwner && req.loggedInUser?.role !== "admin") {
        throw { code: 403, message: "Permission denied" }
      }

      res.json({ data: booking, message: "Booking detail", meta: null })
    } catch (exception) {
      next(exception)
    }
  }

  /**
   * PATCH /api/v1/booking/:id/cancel — the customer calls off their own booking.
   *
   * Deliberately narrow: only the owner, only while it is still pending, and
   * only if they haven't paid. Anything already paid or already out for
   * delivery goes through the shop, so refunds stay a human decision.
   */
  cancelOwnBooking = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const booking = await BookingModel.findById(req.params.id)
      if (!booking) throw { code: 404, message: "Booking not found" }

      if (String(booking.user) !== String(req.loggedInUser?._id)) {
        throw { code: 403, message: "Permission denied" }
      }
      if (booking.status === "cancelled") {
        throw { code: 422, message: "This booking is already cancelled" }
      }
      if (booking.paymentStatus === "paid") {
        throw {
          code: 422,
          message: "This booking is already paid — please call us and we'll sort out the refund.",
        }
      }
      if (booking.status !== "pending") {
        throw { code: 422, message: "This booking is already being prepared — please call us." }
      }

      booking.status = "cancelled"
      await booking.save()

      // Cancelling frees the stock, so tell the shop it's back on the shelf.
      try {
        await emailService.sendEmail({
          to: smtpConfig.fromAddress,
          sub: `Booking cancelled: ${booking.code}`,
          message: `<p>${booking.customerName} cancelled booking <b>${booking.code}</b>. The gear is available again.</p>`,
        })
      } catch {
        log.error("Cancellation notice could not be sent")
      }

      res.json({ data: booking, message: "Booking cancelled", meta: null })
    } catch (exception) {
      next(exception)
    }
  }

  /** GET /api/v1/booking — admin inbox with status/payment filters. */
  listAllBookings = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const { page, limit, skip } = getPagination(req.query as Record<string, unknown>)

      const filter: Record<string, unknown> = {}
      if (req.query.status) filter.status = req.query.status
      if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus
      if (req.query.search) filter.code = { $regex: String(req.query.search), $options: "i" }

      const [items, total] = await Promise.all([
        BookingModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        BookingModel.countDocuments(filter),
      ])

      res.json({ data: items, message: "Booking list", meta: { page, limit, total } })
    } catch (exception) {
      next(exception)
    }
  }

  /** PATCH /api/v1/booking/:id/status — admin moves it through the pipeline. */
  updateBookingStatus = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const booking = await BookingModel.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status },
        { new: true },
      )
      if (!booking) throw { code: 404, message: "Booking not found" }

      res.json({ data: booking, message: "Booking status updated", meta: null })
    } catch (exception) {
      next(exception)
    }
  }

  /** DELETE /api/v1/booking/:id — admin */
  deleteBooking = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const booking = await BookingModel.findByIdAndDelete(req.params.id)
      if (!booking) throw { code: 404, message: "Booking not found" }
      res.json({ data: null, message: "Booking deleted successfully", meta: null })
    } catch (exception) {
      next(exception)
    }
  }
}

export default BookingController
