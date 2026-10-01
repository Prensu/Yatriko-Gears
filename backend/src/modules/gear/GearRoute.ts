import { Router } from "express"
import optionalAuth from "../../middlewares/OptionalAuthMiddleware"
import Auth from "../../middlewares/AuthMiddleware"
import bodyValidator from "../../middlewares/BodyValidationMiddleware"
import GearController from "./GearController"
import { GearCreateDTO, GearUpdateDTO } from "./GearDto"

const gearRouter = Router()
const gearCtrl = new GearController()

gearRouter.post(
  "/",
  Auth(["admin"]),
  bodyValidator(GearCreateDTO),
  gearCtrl.createGear,
)
gearRouter.get("/", optionalAuth, gearCtrl.listAllGear)
gearRouter.get("/:slug", optionalAuth, gearCtrl.getGearDetail)
gearRouter.put(
  "/:slug",
  Auth(["admin"]),
  bodyValidator(GearUpdateDTO),
  gearCtrl.updateGear,
)
gearRouter.delete("/:slug", Auth(["admin"]), gearCtrl.deleteGear)

export default gearRouter
