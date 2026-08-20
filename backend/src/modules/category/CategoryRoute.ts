import { Router } from "express"
import Auth from "../../middlewares/AuthMiddleware"
import bodyValidator from "../../middlewares/BodyValidationMiddleware"
import uploader from "../../middlewares/UploaderMiddleware"
import { optimizeImage } from "../../middlewares/ImageOptimizeMiddleware"
import CategoryController from "./CategoryController"
import { CategoryCreateDTO, CategoryUpdateDTO } from "./CategoryDto"

const categoryRouter = Router()
const catCtrl = new CategoryController()

categoryRouter.post(
  "/",
  Auth(["admin"]),
  uploader("/category").single("image"), // uploader BEFORE bodyValidator
  optimizeImage(1200),
  bodyValidator(CategoryCreateDTO),
  catCtrl.createCategory,
)
categoryRouter.get("/", catCtrl.listAllCategory)
categoryRouter.get("/:slug", catCtrl.getCategoryDetail)
categoryRouter.put(
  "/:slug",
  Auth(["admin"]),
  uploader("/category").single("image"),
  optimizeImage(1200),
  bodyValidator(CategoryUpdateDTO),
  catCtrl.updateCategory,
)
categoryRouter.delete("/:slug", Auth(["admin"]), catCtrl.deleteCategory)

export default categoryRouter
