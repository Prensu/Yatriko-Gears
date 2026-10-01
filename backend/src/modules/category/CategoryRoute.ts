import { Router } from "express"
import optionalAuth from "../../middlewares/OptionalAuthMiddleware"
import Auth from "../../middlewares/AuthMiddleware"
import bodyValidator from "../../middlewares/BodyValidationMiddleware"
import CategoryController from "./CategoryController"
import { CategoryCreateDTO, CategoryUpdateDTO } from "./CategoryDto"

const categoryRouter = Router()
const catCtrl = new CategoryController()

categoryRouter.post(
  "/",
  Auth(["admin"]),
  bodyValidator(CategoryCreateDTO),
  catCtrl.createCategory,
)
categoryRouter.get("/", optionalAuth, catCtrl.listAllCategory)
categoryRouter.get("/:slug", optionalAuth, catCtrl.getCategoryDetail)
categoryRouter.put(
  "/:slug",
  Auth(["admin"]),
  bodyValidator(CategoryUpdateDTO),
  catCtrl.updateCategory,
)
categoryRouter.delete("/:slug", Auth(["admin"]), catCtrl.deleteCategory)

export default categoryRouter
