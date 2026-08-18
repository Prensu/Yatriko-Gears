import type { NextFunction, Response } from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { appConfig } from "../../config/AppConfig"
import AuthModel from "./AuthModel"
import UserModel from "../user/UserModel"
import EmailService from "../../services/EmailService"
import type { IAuthRequest } from "./AuthContract"

const emailService = new EmailService()

class AuthController {
  /** POST /api/v1/auth/register */
  register = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = req.body

      const exists = await UserModel.findOne({ email: body.email })
      if (exists) throw { code: 422, message: "Email already registered" }

      body.password = bcrypt.hashSync(body.password, 12)
      delete body.confirmPassword // never persist

      const user = new UserModel(body)
      await user.save()

      // Non-critical side effect — registration succeeds even if SMTP is down.
      try {
        await emailService.sendEmail({
          to: user.email,
          sub: "Welcome to Yatriko Gears \u26fa",
          message: `<h2>Namaste ${user.name}!</h2><p>Your account is ready. Gear up. Head out. Make memories.</p>`,
        })
      } catch {
        console.error("Welcome email could not be sent")
      }

      const data = user.toObject() as Record<string, unknown>
      delete data.password

      res.json({ data, message: "Registered successfully", meta: null })
    } catch (exception) {
      next(exception)
    }
  }

  /** POST /api/v1/auth/login */
  login = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body

      const userDetail = await UserModel.findOne({ email })
      if (!userDetail) throw { code: 422, message: "Credentials do not match." }

      if (!bcrypt.compareSync(password, userDetail.password)) {
        throw { code: 422, message: "Credentials do not match." }
      }

      const accessToken = jwt.sign({ sub: userDetail._id }, appConfig.jwtSecret, { expiresIn: "1h" })
      const refreshToken = jwt.sign({ sub: userDetail._id }, appConfig.jwtRefreshSecret, { expiresIn: "1d" })

      await new AuthModel({
        userId: userDetail._id,
        accessToken,
        refreshToken,
        status: "active",
        agent: req.headers["user-agent"] ?? "web",
      }).save()

      const user = userDetail.toObject() as Record<string, unknown>
      delete user.password

      res.json({ data: { accessToken, refreshToken, user }, message: "You are loggedIn", meta: null })
    } catch (exception) {
      next(exception)
    }
  }

  /** GET /api/v1/auth/me */
  me = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      res.json({ data: req.loggedInUser, message: "Logged in user detail", meta: null })
    } catch (exception) {
      next(exception)
    }
  }

  /** POST /api/v1/auth/logout — revoke THIS session */
  logout = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const token = (req.headers.authorization ?? "").replace("Bearer ", "").trim()
      await AuthModel.updateOne({ accessToken: token }, { status: "revoked" })
      res.json({ data: null, message: "Logged out successfully", meta: null })
    } catch (exception) {
      next(exception)
    }
  }

  /** POST /api/v1/auth/refresh-token */
  refreshToken = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body

      // 1. session holding this refresh token must still be active
      const session = await AuthModel.findOne({ refreshToken, status: "active" })
      if (!session) throw { code: 401, message: "TOKEN_EXPIRED" }

      // 2. verify against the REFRESH secret
      const data = jwt.verify(refreshToken, appConfig.jwtRefreshSecret) as jwt.JwtPayload

      const userDetail = await UserModel.findById(data.sub, { password: 0 })
      if (!userDetail) throw { code: 422, message: "User not found or already deleted" }

      // 3. rotate: revoke old session, issue a fresh pair
      session.status = "revoked"
      await session.save()

      const accessToken = jwt.sign({ sub: userDetail._id }, appConfig.jwtSecret, { expiresIn: "1h" })
      const newRefreshToken = jwt.sign({ sub: userDetail._id }, appConfig.jwtRefreshSecret, { expiresIn: "1d" })

      await new AuthModel({
        userId: userDetail._id,
        accessToken,
        refreshToken: newRefreshToken,
        status: "active",
        agent: req.headers["user-agent"] ?? "web",
      }).save()

      res.json({ data: { accessToken, refreshToken: newRefreshToken }, message: "Token refreshed", meta: null })
    } catch (exception) {
      if (exception instanceof jwt.TokenExpiredError) {
        next({ code: 401, message: "TOKEN_EXPIRED" })
      } else if (exception instanceof jwt.JsonWebTokenError) {
        next({ code: 401, message: exception.message })
      } else {
        next(exception)
      }
    }
  }

  /** POST /api/v1/auth/forgot-password — identical response whether or not the email exists */
  forgotPassword = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body

      const userDetail = await UserModel.findOne({ email })
      if (userDetail) {
        const resetToken = jwt.sign(
          { sub: userDetail._id, purpose: "reset-password" }, // purpose-scoped
          appConfig.jwtSecret,
          { expiresIn: "15m" },
        )
        try {
          await emailService.sendEmail({
            to: userDetail.email,
            sub: "Yatriko Gears \u2014 Password reset",
            message: `<p>Use this token within 15 minutes to reset your password:</p><p><code>${resetToken}</code></p>`,
          })
        } catch {
          console.error("Reset email could not be sent")
        }
      }

      res.json({ data: null, message: "Forget password request sent to email", meta: null })
    } catch (exception) {
      next(exception)
    }
  }

  /** POST /api/v1/auth/reset-password */
  resetPassword = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const { resetToken, password } = req.body

      const data = jwt.verify(resetToken, appConfig.jwtSecret) as jwt.JwtPayload
      // An access token must not be usable as a reset token.
      if (data.purpose !== "reset-password") throw { code: 401, message: "Invalid reset token" }

      const userDetail = await UserModel.findById(data.sub)
      if (!userDetail) throw { code: 422, message: "User not found or already deleted" }

      userDetail.password = bcrypt.hashSync(password, 12)
      await userDetail.save()

      // Revoke ALL active sessions for this user.
      await AuthModel.updateMany({ userId: userDetail._id, status: "active" }, { status: "revoked" })

      res.json({ data: null, message: "Password reset successfully. Please login again.", meta: null })
    } catch (exception) {
      if (exception instanceof jwt.TokenExpiredError) {
        next({ code: 401, message: "TOKEN_EXPIRED" })
      } else if (exception instanceof jwt.JsonWebTokenError) {
        next({ code: 401, message: exception.message })
      } else {
        next(exception)
      }
    }
  }
}

export default AuthController
