import type { NextFunction, Response } from "express"
import crypto from "node:crypto"
import BookingModel from "../booking/BookingModel"
import { esewaConfig } from "../../config/AppConfig"
import {
  buildPaymentForm,
  callbackSignatureMatches,
  decodeCallback,
  verifyWithEsewa,
} from "./EsewaService"
import type { IAuthRequest } from "../auth/AuthContract"

class PaymentController {
  /**
   * POST /api/v1/payment/esewa/initiate — hand the browser a signed form.
   *
   * The amount is read from the stored booking, never from the request, so a
   * customer cannot pay Rs. 1 for a Rs. 5,000 rental.
   */
  initiateEsewa = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const booking = await BookingModel.findById(req.body.bookingId)
      if (!booking) throw { code: 404, message: "Booking not found" }

      const isOwner = String(booking.user) === String(req.loggedInUser?._id)
      if (!isOwner && req.loggedInUser?.role !== "admin") {
        throw { code: 403, message: "Permission denied" }
      }
      if (booking.paymentStatus === "paid") {
        throw { code: 422, message: "This booking is already paid" }
      }
      if (booking.status === "cancelled") {
        throw { code: 422, message: "This booking was cancelled" }
      }

      // A fresh uuid per attempt: eSewa rejects a re-used one after a failure.
      const transactionUuid = `${booking.code}-${crypto.randomBytes(3).toString("hex")}`
      booking.set("payment.transactionUuid", transactionUuid)
      booking.set("payment.amount", booking.total)
      await booking.save()

      const payload = buildPaymentForm({
        totalAmount: booking.total,
        transactionUuid,
        successUrl: `${esewaConfig.siteUrl}/payment/success`,
        failureUrl: `${esewaConfig.siteUrl}/payment/failure?booking=${booking._id}`,
      })

      res.json({ data: payload, message: "Payment initiated", meta: null })
    } catch (exception) {
      next(exception)
    }
  }

  /**
   * POST /api/v1/payment/esewa/verify — confirm and settle.
   *
   * Flow: decode the redirect payload → find OUR booking by transaction_uuid →
   * ask eSewa server-to-server whether that transaction is really COMPLETE for
   * that exact amount → only then mark it paid. The redirect payload alone is
   * never trusted.
   */
  verifyEsewa = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const callback = decodeCallback(req.body.data)
      if (!callback.transaction_uuid) {
        throw { code: 400, message: "Malformed eSewa response" }
      }

      const booking = await BookingModel.findOne({
        "payment.transactionUuid": callback.transaction_uuid,
      })
      if (!booking) throw { code: 404, message: "No booking matches this payment" }

      // Replaying the same redirect must not double-settle anything.
      if (booking.paymentStatus === "paid") {
        res.json({ data: booking, message: "Payment already confirmed", meta: null })
        return
      }

      if (!callbackSignatureMatches(callback)) {
        console.warn(`eSewa callback signature mismatch for ${callback.transaction_uuid}`)
      }

      const status = await verifyWithEsewa({
        transactionUuid: callback.transaction_uuid,
        totalAmount: booking.total,
      })

      if (status.status !== "COMPLETE") {
        throw { code: 422, message: `Payment not completed (eSewa says: ${status.status ?? "UNKNOWN"})` }
      }
      // Guard against a COMPLETE transaction for a different, smaller amount.
      if (Number(status.total_amount) !== booking.total) {
        throw { code: 422, message: "Paid amount does not match the booking total" }
      }

      booking.paymentStatus = "paid"
      booking.status = "confirmed"
      booking.set("payment.transactionCode", callback.transaction_code ?? null)
      booking.set("payment.refId", status.ref_id ?? null)
      booking.set("payment.verifiedAt", new Date())
      await booking.save()

      res.json({ data: booking, message: "Payment verified successfully", meta: null })
    } catch (exception) {
      if (exception instanceof SyntaxError) {
        next({ code: 400, message: "Malformed eSewa response" })
      } else {
        next(exception)
      }
    }
  }
}

export default PaymentController
