import { Router } from "express"
import optionalAuth from "../../middlewares/OptionalAuthMiddleware"
import Auth from "../../middlewares/AuthMiddleware"
import bodyValidator from "../../middlewares/BodyValidationMiddleware"
import PackageController from "./PackageController"
import { PackageCreateDTO, PackageUpdateDTO } from "./PackageDto"

const packageRouter = Router()
const pkgCtrl = new PackageController()

packageRouter.post("/", Auth(["admin"]), bodyValidator(PackageCreateDTO), pkgCtrl.createPackage)
packageRouter.get("/", optionalAuth, pkgCtrl.listAllPackages)
packageRouter.get("/:slug", optionalAuth, pkgCtrl.getPackageDetail)
packageRouter.put("/:slug", Auth(["admin"]), bodyValidator(PackageUpdateDTO), pkgCtrl.updatePackage)
packageRouter.delete("/:slug", Auth(["admin"]), pkgCtrl.deletePackage)

export default packageRouter
