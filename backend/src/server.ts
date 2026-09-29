import "./config/mongodbConfig" // side effect: connect DB at boot
import app from "./app"
import { appConfig } from "./config/AppConfig"
import { loggerFor } from "./config/logger"
import EmailService from "./services/EmailService"

const log = loggerFor("server")

app.listen(appConfig.port, () => {
  log.info(`Server is running at http://localhost:${appConfig.port}`)
  void new EmailService().verifyConnection().catch((exception) => {
    log.error({ err: exception }, "Email service is not configured correctly; contact and booking emails will not be delivered")
  })
})
