import mongoose from "mongoose"
import { mongoConfig } from "./AppConfig"

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
    console.log("***** MongoDB Connected Successfully *****")
  } catch (exception) {
    console.error("***** MongoDB connection failed — server running WITHOUT a database *****")
    console.error(exception)
    // NOTE: NOT calling process.exit(1) so the server can still serve
    // requests that don't need DB (health checks, static files, etc.).
  }
})()
