import { Router } from "express"
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
gearRouter.get("/", gearCtrl.listAllGear)
gearRouter.get("/:slug", gearCtrl.getGearDetail)
gearRouter.put(
  "/:slug",
  Auth(["admin"]),
  bodyValidator(GearUpdateDTO),
  gearCtrl.updateGear,
)
gearRouter.delete("/:slug", Auth(["admin"]), gearCtrl.deleteGear)

export default gearRouter
