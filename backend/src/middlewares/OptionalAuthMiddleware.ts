import type { NextFunction, Response } from "express"
import jwt from "jsonwebtoken"
import { appConfig } from "../config/AppConfig"
import AuthModel from "../modules/auth/AuthModel"
import UserModel from "../modules/user/UserModel"
import type { IAuthRequest } from "../modules/auth/AuthContract"
export default async function optionalAuth(req: IAuthRequest, _res: Response, next: NextFunction) { try { const header = req.headers.authorization; if (!header?.startsWith("Bearer ")) return next(); const token = header.slice(7).trim(); if (!await AuthModel.findOne({ accessToken: token, status: "active" })) return next(); const data = jwt.verify(token, appConfig.jwtSecret) as jwt.JwtPayload; const user = await UserModel.findById(data.sub, { password: 0 }); if (user) req.loggedInUser = { _id: user._id, name: user.name, email: user.email, role: user.role } } catch { /* fail open */ } next() }
