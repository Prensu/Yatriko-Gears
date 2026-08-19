import { Router } from "express"
import rateLimit from "express-rate-limit"
import authRouter from "../modules/auth/AuthRoute"
import userRouter from "../modules/user/UserRoute"
import categoryRouter from "../modules/category/CategoryRoute"
import gearRouter from "../modules/gear/GearRoute"
import packageRouter from "../modules/package/PackageRoute"
import destinationRouter from "../modules/destination/DestinationRoute"
import videoRouter from "../modules/video/VideoRoute"
import contactRouter from "../modules/contact/ContactRoute"
import subscriberRouter from "../modules/subscriber/SubscriberRoute"
import bookingRouter from "../modules/booking/BookingRoute"
import paymentRouter from "../modules/payment/PaymentRoute"
import chatRouter from "../modules/chat/ChatRouter"

const router = Router()

// Tighter rate limit on auth endpoints (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { data: null, message: "Too many attempts, try again later", meta: null },
})

// Public forms get their own modest limiter (spam protection)
const formLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { data: null, message: "Too many submissions, try again later", meta: null },
})

router.use("/auth", authLimiter, authRouter)
router.use("/user", userRouter)
router.use("/category", categoryRouter)
router.use("/gear", gearRouter)
router.use("/package", packageRouter)
router.use("/destination", destinationRouter)
router.use("/video", videoRouter)
router.use("/booking", bookingRouter)
router.use("/payment", paymentRouter)
router.use("/contact", formLimiter, contactRouter)
router.use("/subscriber", formLimiter, subscriberRouter)
router.use("/chat",chatRouter)

export default router
