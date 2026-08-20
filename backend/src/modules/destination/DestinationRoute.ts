import { Router } from "express"
import Auth from "../../middlewares/AuthMiddleware"
import bodyValidator from "../../middlewares/BodyValidationMiddleware"
import uploader from "../../middlewares/UploaderMiddleware"
import { optimizeImage } from "../../middlewares/ImageOptimizeMiddleware"
import DestinationController from "./DestinationController"
import { DestinationCreateDTO, DestinationUpdateDTO } from "./DestinationDto"

const destinationRouter = Router()
const destCtrl = new DestinationController()

destinationRouter.post(
  "/",
  Auth(["admin"]),
  uploader("/destination").single("image"),
  optimizeImage(1600),
  bodyValidator(DestinationCreateDTO),
  destCtrl.createDestination,
)
destinationRouter.get("/", destCtrl.listAllDestinations)
destinationRouter.get("/:slug", destCtrl.getDestinationDetail)
destinationRouter.put(
  "/:slug",
  Auth(["admin"]),
  uploader("/destination").single("image"),
  optimizeImage(1600),
  bodyValidator(DestinationUpdateDTO),
  destCtrl.updateDestination,
)
destinationRouter.delete("/:slug", Auth(["admin"]), destCtrl.deleteDestination)

export default destinationRouter
