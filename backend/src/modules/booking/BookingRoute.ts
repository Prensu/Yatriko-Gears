import { Router } from "express"
import Auth from "../../middlewares/AuthMiddleware"
import bodyValidator from "../../middlewares/BodyValidationMiddleware"
import BookingController from "./BookingController"
import { BookingCreateDTO, BookingStatusDTO } from "./BookingDto"

const bookingRouter = Router()
const bookingCtrl = new BookingController()

// Customer-facing — any logged-in user.
bookingRouter.post("/", Auth(), bodyValidator(BookingCreateDTO), bookingCtrl.createBooking)
bookingRouter.get("/my", Auth(), bookingCtrl.myBookings)

// Public: the booking form checks stock before the customer commits.
bookingRouter.get("/availability", bookingCtrl.checkAvailability)

// Customers can call off their own unpaid, not-yet-prepared booking.
bookingRouter.patch("/:id/cancel", Auth(), bookingCtrl.cancelOwnBooking)

// Admin inbox. Declared before "/:id" so "my" never looks like an id.
bookingRouter.get("/", Auth(["admin"]), bookingCtrl.listAllBookings)
bookingRouter.patch(
  "/:id/status",
  Auth(["admin"]),
  bodyValidator(BookingStatusDTO),
  bookingCtrl.updateBookingStatus,
)
bookingRouter.delete("/:id", Auth(["admin"]), bookingCtrl.deleteBooking)

// Owner or admin — kept last so it doesn't shadow the routes above.
bookingRouter.get("/:id", Auth(), bookingCtrl.getBookingDetail)

export default bookingRouter
