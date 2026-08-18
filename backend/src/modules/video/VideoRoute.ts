import { Router } from "express"
import Auth from "../../middlewares/AuthMiddleware"
import bodyValidator from "../../middlewares/BodyValidationMiddleware"
import VideoController from "./VideoController"
import { VideoCreateDTO, VideoUpdateDTO } from "./VideoDto"

const videoRouter = Router()
const videoCtrl = new VideoController()

videoRouter.get("/", videoCtrl.listAllVideos)
videoRouter.post("/upload-signature", Auth(["admin"]), videoCtrl.getUploadSignature)
videoRouter.post("/", Auth(["admin"]), bodyValidator(VideoCreateDTO), videoCtrl.createVideo)
videoRouter.put("/:id", Auth(["admin"]), bodyValidator(VideoUpdateDTO), videoCtrl.updateVideo)
videoRouter.delete("/:id", Auth(["admin"]), videoCtrl.deleteVideo)

export default videoRouter
