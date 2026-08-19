import { Router } from "express"
import Auth from "../../middlewares/AuthMiddleware"
import bodyValidator from "../../middlewares/BodyValidationMiddleware"
import uploader from "../../middlewares/UploaderMiddleware"
import AuthController from "./AuthController"
import {
  UserRegisterDTO,
  UserLoginDTO,
  GoogleLoginDTO,
  RefreshTokenDTO,
  UpdateProfileDTO,
  ForgotPasswordDTO,
  ResetPasswordDTO,
} from "./AuthDto"

const authRouter = Router()
const authCtrl = new AuthController()

authRouter.post("/register", bodyValidator(UserRegisterDTO), authCtrl.register)
authRouter.post("/login", bodyValidator(UserLoginDTO), authCtrl.login)
authRouter.post("/google", bodyValidator(GoogleLoginDTO), authCtrl.googleLogin)
authRouter.get("/me", Auth(), authCtrl.me)
authRouter.patch(
  "/me",
  Auth(),
  uploader("/user").single("image"), // uploader BEFORE bodyValidator
  bodyValidator(UpdateProfileDTO),
  authCtrl.updateProfile,
)
authRouter.post("/logout", Auth(), authCtrl.logout)
authRouter.post("/refresh-token", bodyValidator(RefreshTokenDTO), authCtrl.refreshToken)
authRouter.post("/forgot-password", bodyValidator(ForgotPasswordDTO), authCtrl.forgotPassword)
authRouter.post("/reset-password", bodyValidator(ResetPasswordDTO), authCtrl.resetPassword)

export default authRouter
