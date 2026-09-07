import { Router } from "express"
import Auth from "../../middlewares/AuthMiddleware"
import bodyValidator from "../../middlewares/BodyValidationMiddleware"
import DestinationController from "./DestinationController"
import { DestinationCreateDTO, DestinationUpdateDTO } from "./DestinationDto"

const destinationRouter = Router()
const destCtrl = new DestinationController()

destinationRouter.post(
  "/",
  Auth(["admin"]),
  bodyValidator(DestinationCreateDTO),
  destCtrl.createDestination,
)
destinationRouter.get("/", destCtrl.listAllDestinations)
destinationRouter.get("/:slug", destCtrl.getDestinationDetail)
destinationRouter.put(
  "/:slug",
  Auth(["admin"]),
  bodyValidator(DestinationUpdateDTO),
  destCtrl.updateDestination,
)
destinationRouter.delete("/:slug", Auth(["admin"]), destCtrl.deleteDestination)

export default destinationRouter
