import { Router } from "express"
import Auth from "../../middlewares/AuthMiddleware"
import bodyValidator from "../../middlewares/BodyValidationMiddleware"
import PaymentController from "./PaymentController"
import { EsewaInitiateDTO, EsewaVerifyDTO } from "./PaymentDto"

const paymentRouter = Router()
const paymentCtrl = new PaymentController()

paymentRouter.post(
  "/esewa/initiate",
  Auth(),
  bodyValidator(EsewaInitiateDTO),
  paymentCtrl.initiateEsewa,
)

/**
 * Public on purpose: eSewa bounces the customer back through the browser and
 * the session cookie/token may not survive the round trip. Safety comes from
 * the server-to-server status check, not from the caller's identity.
 */
paymentRouter.post("/esewa/verify", bodyValidator(EsewaVerifyDTO), paymentCtrl.verifyEsewa)

export default paymentRouter
