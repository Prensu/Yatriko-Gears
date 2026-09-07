import { Router } from "express"
import Auth from "../../middlewares/AuthMiddleware"
import UploadController from "./UploadController"

const uploadRouter = Router()
const uploadCtrl = new UploadController()

uploadRouter.get("/sign", Auth(), uploadCtrl.getUploadSignature)
uploadRouter.post("/sign", Auth(), uploadCtrl.getUploadSignature)

export default uploadRouter
