import { Router } from "express"
import Auth from "../../middlewares/AuthMiddleware"
import bodyValidator from "../../middlewares/BodyValidationMiddleware"
import uploader from "../../middlewares/UploaderMiddleware"
import { optimizeImage } from "../../middlewares/ImageOptimizeMiddleware"
import SettingsController from "./SettingsController"
import { SettingsUpdateDTO } from "./SettingsDto"

const settingsRouter = Router()
const ctrl = new SettingsController()

settingsRouter.get("/", ctrl.getSettings)

settingsRouter.put(
  "/",
  Auth(["admin"]),
  uploader("/settings").single("image"), // uploader BEFORE bodyValidator
  optimizeImage(1200),
  bodyValidator(SettingsUpdateDTO),
  ctrl.updateSettings,
)

export default settingsRouter
