import type { NextFunction, Response } from "express"
import UserModel from "./UserModel"
import AuthModel from "../auth/AuthModel"
import { getPagination } from "../../utilities/helpers"
import type { IAuthRequest } from "../auth/AuthContract"

class UserController {
  /** GET /api/v1/user — admin list with pagination + search */
  listAllUsers = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const { page, limit, skip } = getPagination(req.query as Record<string, unknown>)

      const filter: Record<string, unknown> = {}
      if (req.query.role) filter.role = req.query.role
      if (req.query.search) filter.name = { $regex: String(req.query.search), $options: "i" }

      const [users, total] = await Promise.all([
        UserModel.find(filter, { password: 0 }).sort({ createdAt: -1 }).skip(skip).limit(limit),
        UserModel.countDocuments(filter),
      ])

      res.json({ data: users, message: "User list", meta: { page, limit, total } })
    } catch (exception) {
      next(exception)
    }
  }

  /** GET /api/v1/user/:id */
  getUserDetail = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = await UserModel.findById(req.params.id, { password: 0 })
      if (!user) throw { code: 404, message: "User not found" }
      res.json({ data: user, message: "User detail", meta: null })
    } catch (exception) {
      next(exception)
    }
  }

  /** DELETE /api/v1/user/:id — also revokes all their active sessions */
  deleteUser = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = await UserModel.findByIdAndDelete(req.params.id)
      if (!user) throw { code: 404, message: "User not found" }

      await AuthModel.updateMany({ userId: user._id, status: "active" }, { status: "revoked" })

      res.json({ data: null, message: "User deleted successfully", meta: null })
    } catch (exception) {
      next(exception)
    }
  }
}

export default UserController
