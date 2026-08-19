import type { NextFunction, Response } from "express"
import BookingModel from "./BookingModel"
import GearModel from "../gear/GearModel"
import EmailService from "../../services/EmailService"
import { smtpConfig } from "../../config/AppConfig"
import { getPagination } from "../../utilities/helpers"
import type { IAuthRequest } from "../auth/AuthContract"

const emailService = new EmailService()

/** Delivery is free inside the valley; kept as a field so it can change later. */
const DELIVERY_CHARGE = 0

/** YG-250819-4F2A — short enough to read out on the phone. */
function makeBookingCode(): string {
  const stamp = new Date().toISOString().slice(2, 10).replace(/-/g, "")
  const random = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `YG-${stamp}-${random}`
}

/** Inclusive day count: picking up and returning the same day is 1 day. */
function countDays(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime()
  return Math.max(1, Math.round(ms / 86400000) + 1)
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

      const subtotal = items.reduce(
        (sum: number, item: { pricePerDay: number; quantity: number }) =>
          sum + item.pricePerDay * item.quantity * days,
        0,
      )
      const total = subtotal + DELIVERY_CHARGE

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

      // Non-critical: the booking stands even if SMTP is down.
      try {
        await emailService.sendEmail({
          to: smtpConfig.fromAddress,
          sub: `New booking ${booking.code}`,
          message: `<p><b>${booking.customerName}</b> (${booking.customerPhone}) booked ${items.length} item(s) for ${days} day(s).</p><p>Total: Rs. ${total}</p>`,
        })
      } catch {
        console.error("Booking notification email could not be sent")
      }

      res.json({ data: booking, message: "Booking created successfully", meta: null })
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
