import { Router } from "express"
import Auth from "../../middlewares/AuthMiddleware"
import bodyValidator from "../../middlewares/BodyValidationMiddleware"
import AuthController from "./AuthController"
import {
  UserRegisterDTO,
  UserLoginDTO,
  RefreshTokenDTO,
  ForgotPasswordDTO,
  ResetPasswordDTO,
} from "./AuthDto"

const authRouter = Router()
const authCtrl = new AuthController()

authRouter.post("/register", bodyValidator(UserRegisterDTO), authCtrl.register)
authRouter.post("/login", bodyValidator(UserLoginDTO), authCtrl.login)
authRouter.get("/me", Auth(), authCtrl.me)
authRouter.post("/logout", Auth(), authCtrl.logout)
authRouter.post("/refresh-token", bodyValidator(RefreshTokenDTO), authCtrl.refreshToken)
authRouter.post("/forgot-password", bodyValidator(ForgotPasswordDTO), authCtrl.forgotPassword)
authRouter.post("/reset-password", bodyValidator(ResetPasswordDTO), authCtrl.resetPassword)

export default authRouter
