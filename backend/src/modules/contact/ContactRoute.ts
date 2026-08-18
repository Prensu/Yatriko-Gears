import { Router } from "express"
import Auth from "../../middlewares/AuthMiddleware"
import bodyValidator from "../../middlewares/BodyValidationMiddleware"
import ContactController from "./ContactController"
import { ContactCreateDTO, ContactStatusDTO } from "./ContactDto"

const contactRouter = Router()
const contactCtrl = new ContactController()

contactRouter.post("/", bodyValidator(ContactCreateDTO), contactCtrl.createContact)
contactRouter.get("/", Auth(["admin"]), contactCtrl.listAllContacts)
contactRouter.patch("/:id/status", Auth(["admin"]), bodyValidator(ContactStatusDTO), contactCtrl.updateContactStatus)
contactRouter.delete("/:id", Auth(["admin"]), contactCtrl.deleteContact)

export default contactRouter
