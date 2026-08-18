import type { Request } from "express"
import type { Types } from "mongoose"

export type LoggedInUser = {
  _id: Types.ObjectId
  name?: string | null
  email?: string | null
  role?: string | null
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      loggedInUser?: LoggedInUser
    }
  }
}

export interface IAuthRequest extends Request {
  loggedInUser?: LoggedInUser
}
