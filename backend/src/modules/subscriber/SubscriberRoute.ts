import { Router } from "express"
import Auth from "../../middlewares/AuthMiddleware"
import bodyValidator from "../../middlewares/BodyValidationMiddleware"
import SubscriberController from "./SubscriberController"
import { SubscriberCreateDTO } from "./SubscriberDto"

const subscriberRouter = Router()
const subCtrl = new SubscriberController()

subscriberRouter.post("/", bodyValidator(SubscriberCreateDTO), subCtrl.createSubscriber)
subscriberRouter.get("/", Auth(["admin"]), subCtrl.listAllSubscribers)
subscriberRouter.delete("/:id", Auth(["admin"]), subCtrl.deleteSubscriber)

export default subscriberRouter
