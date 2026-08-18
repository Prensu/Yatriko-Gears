import path from "node:path"
import express from "express"
import helmet from "helmet"
import cors from "cors"
import rateLimit from "express-rate-limit"
import { appConfig } from "./config/AppConfig"
import router from "./router/router"
import ErrorHandlingMiddleware from "./middlewares/ErrorHandlingMiddleware"

const app = express()

// 1. Security headers — first
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // allow <img> from the frontend origin
  }),
)

// 2. CORS — explicit allowlist, not "*"
app.use(
  cors({
    origin: appConfig.allowedOrigins,
    credentials: true,
  }),
)

// 3. Rate limiting (a tighter limiter is mounted on /auth inside the router)
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  }),
)

// 4. Body parsers — limit kept in sync with multer fileSize (3 MB)
app.use(express.json({ limit: "3mb" }))
app.use(express.urlencoded({ limit: "3mb", extended: true }))

// 5. Static files (uploaded images, read-only)
app.use("/images", express.static(path.resolve("./public/uploads/")))

// 5.5 Health check — before versioned routes, no auth needed
app.get("/health", (_req, res) => {
  // Lazy import to avoid circular dependency at module level
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mongoose = require("mongoose")
  res.json({
    status: "ok",
    uptime: process.uptime(),
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  })
})

// 6. Versioned router mount
app.use("/api/v1", router)

// 7. 404 catch-all — after all routes
app.use((req, res, next) => {
  next({ code: 404, message: "Route not found" })
})

// 8. Error handler — ALWAYS LAST
app.use(ErrorHandlingMiddleware)

export default app
