import "./config/mongodbConfig" // side effect: connect DB at boot
import app from "./app"
import { appConfig } from "./config/AppConfig"
import { loggerFor } from "./config/logger"

const log = loggerFor("server")

app.listen(appConfig.port, () => {
  log.info(`Server is running at http://localhost:${appConfig.port}`)
})
