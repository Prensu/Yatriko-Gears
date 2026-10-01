import { Router } from "express"
import rateLimit from "express-rate-limit"
import ChatController from "./ChatController"
import bodyValidator from "../../middlewares/BodyValidationMiddleware"
import { z } from "zod"

const chatRouter = Router()
const chatCtrl = new ChatController()

// Rate limit chatbot to prevent abuse (60 messages per 15 min per IP)
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { data: null, message: "Too many messages — please try again later", meta: null },
})

chatRouter.post("/", chatLimiter, bodyValidator(z.object({ message: z.string().min(1).max(1000), sessionId: z.string().uuid().optional() })), chatCtrl.sendMessage)

export default chatRouter
