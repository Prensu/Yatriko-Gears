import { Router } from "express"
import Auth from "../../middlewares/AuthMiddleware"
import UserController from "./UserController"

const userRouter = Router()
const userCtrl = new UserController()

userRouter.get("/", Auth(["admin"]), userCtrl.listAllUsers)
userRouter.get("/:id", Auth(["admin"]), userCtrl.getUserDetail)
userRouter.delete("/:id", Auth(["admin"]), userCtrl.deleteUser)

export default userRouter
