import mongoose from "mongoose"
import { mongoConfig } from "./AppConfig"
import { loggerFor } from "../config/logger"

const log = loggerFor("mongodbConfig")

// Side-effect import: connects at boot.
// If the DB is unavailable the server still starts — endpoints that
// hit Mongoose will return 500s, but static/health routes keep working.
;(async () => {
  try {
    await mongoose.connect(mongoConfig.url, {
      dbName: mongoConfig.dbName,
      autoCreate: true,
      autoIndex: true,
    })
    log.info("***** MongoDB Connected Successfully *****")
  } catch (exception) {
    log.error("***** MongoDB connection failed — server running WITHOUT a database *****")
    log.error(exception)
    // NOTE: NOT calling process.exit(1) so the server can still serve
    // requests that don't need DB (health checks, static files, etc.).
  }
})()
