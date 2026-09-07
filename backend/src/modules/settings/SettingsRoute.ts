import { Router } from "express"
import Auth from "../../middlewares/AuthMiddleware"
import bodyValidator from "../../middlewares/BodyValidationMiddleware"
import SettingsController from "./SettingsController"
import { SettingsUpdateDTO } from "./SettingsDto"

const settingsRouter = Router()
const ctrl = new SettingsController()

settingsRouter.get("/", ctrl.getSettings)

settingsRouter.put(
  "/",
  Auth(["admin"]),
  bodyValidator(SettingsUpdateDTO),
  ctrl.updateSettings,
)

export default settingsRouter
