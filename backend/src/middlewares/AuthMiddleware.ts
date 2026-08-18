import type { NextFunction, Response } from "express"
import jwt from "jsonwebtoken"
import { appConfig } from "../config/AppConfig"
import AuthModel from "../modules/auth/AuthModel"
import UserModel from "../modules/user/UserModel"
import type { IAuthRequest } from "../modules/auth/AuthContract"

/**
 * Higher-order middleware: Auth(roles?) → middleware.
 * - Auth()            → any logged-in user
 * - Auth(["admin"])  → admins only (admin always passes any role gate)
 * JWT + revocable DB session: the session row must still be active.
 */
const Auth = (allowedRoles: Array<string> | null = null) => {
  return async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      let token = req.headers.authorization
      if (!token) throw { code: 401, message: "Unauthorized" }

      token = token.replace("Bearer ", "").trim()

      // 1. session must still be active in DB (logout/reset revokes it)
      const session = await AuthModel.findOne({ accessToken: token, status: "active" })
      if (!session) throw { code: 401, message: "TOKEN_EXPIRED" }

      // 2. verify signature + expiry
      const data = jwt.verify(token, appConfig.jwtSecret) as jwt.JwtPayload

      // 3. load the user, never select the password
      const userDetail = await UserModel.findById(data.sub, { password: 0 })
      if (!userDetail) throw { code: 422, message: "User not found or already deleted" }

      // 4. attach to request for downstream controllers
      req.loggedInUser = {
        _id: userDetail._id,
        name: userDetail.name,
        email: userDetail.email,
        role: userDetail.role,
      }

      // 5. role check — admin always passes; no roles given = any logged-in user
      if (!allowedRoles || userDetail.role === "admin" || allowedRoles.includes(userDetail.role)) {
        next()
      } else {
        throw { code: 403, message: "Permission denied" }
      }
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

export default Auth
