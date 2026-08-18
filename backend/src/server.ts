import "./config/mongodbConfig" // side effect: connect DB at boot
import app from "./app"
import { appConfig } from "./config/AppConfig"

app.listen(appConfig.port, () => {
  console.log(`Server is running at http://localhost:${appConfig.port}`)
})
