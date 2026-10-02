import { Router } from "express"
import optionalAuth from "../../middlewares/OptionalAuthMiddleware"
import Auth from "../../middlewares/AuthMiddleware"
import bodyValidator from "../../middlewares/BodyValidationMiddleware"
import BlogController from "./BlogController"
import { BlogCreateDTO, BlogUpdateDTO } from "./BlogDto"

const blogRouter = Router()
const blogCtrl = new BlogController()

blogRouter.get("/", optionalAuth, blogCtrl.listAllBlogs)
blogRouter.get("/:slug", optionalAuth, blogCtrl.getBlogDetail)
blogRouter.post("/", Auth(["admin"]), bodyValidator(BlogCreateDTO), blogCtrl.createBlog)
blogRouter.put("/:slug", Auth(["admin"]), bodyValidator(BlogUpdateDTO), blogCtrl.updateBlog)
blogRouter.delete("/:slug", Auth(["admin"]), blogCtrl.deleteBlog)

export default blogRouter
