import { Router } from "express"
import rateLimit from "express-rate-limit"
import ChatController from "./ChatController"

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

chatRouter.post("/", chatLimiter, chatCtrl.sendMessage)

export default chatRouter
