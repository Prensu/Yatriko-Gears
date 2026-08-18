import { Router } from "express"
import Auth from "../../middlewares/AuthMiddleware"
import bodyValidator from "../../middlewares/BodyValidationMiddleware"
import uploader from "../../middlewares/UploaderMiddleware"
import GearController from "./GearController"
import { GearCreateDTO, GearUpdateDTO } from "./GearDto"

const gearRouter = Router()
const gearCtrl = new GearController()

gearRouter.post(
  "/",
  Auth(["admin"]),
  uploader("/gear").single("image"), // uploader BEFORE bodyValidator
  bodyValidator(GearCreateDTO),
  gearCtrl.createGear,
)
gearRouter.get("/", gearCtrl.listAllGear)
gearRouter.get("/:slug", gearCtrl.getGearDetail)
gearRouter.put(
  "/:slug",
  Auth(["admin"]),
  uploader("/gear").single("image"),
  bodyValidator(GearUpdateDTO),
  gearCtrl.updateGear,
)
gearRouter.delete("/:slug", Auth(["admin"]), gearCtrl.deleteGear)

export default gearRouter
