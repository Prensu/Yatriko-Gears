import path from "node:path"
import express from "express"
import helmet from "helmet"
import cors from "cors"
import rateLimit from "express-rate-limit"
import pinoHttp from "pino-http"
import crypto from "node:crypto"
import { appConfig } from "./config/AppConfig"
import { logger } from "./config/logger"
import router from "./router/router"
import ErrorHandlingMiddleware from "./middlewares/ErrorHandlingMiddleware"

const app = express()

/**
 * Render (and Vercel, and any other PaaS) puts the app behind a proxy, so
 * req.ip is the proxy's address unless we trust the X-Forwarded-For header.
 * Without this, express-rate-limit buckets every visitor together and one
 * noisy client can lock out the whole site.
 */
app.set("trust proxy", 1)

/**
 * 0. Request logging. Every line carries a request id, so a customer saying
 * "my payment failed at 3pm" can be traced through the whole request.
 */
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => (req.headers["x-request-id"] as string) ?? crypto.randomUUID(),

    /**
     * Health checks and static images would otherwise drown the stream — one
     * page load pulls a dozen images and says nothing useful about the app.
     */
    autoLogging: {
      ignore: (req) => req.url === "/health" || (req.url ?? "").startsWith("/images/"),
    },

    /**
     * One readable line per request. pino-http's defaults serialize the whole
     * req/res objects — every header, both directions — which is unreadable in
     * a terminal and expensive in a hosted log stream. Failures still get full
     * context from the error handler, including the stack.
     */
    serializers: {
      req: (req) => ({ id: req.id, method: req.method, url: req.url }),
      res: (res) => ({ statusCode: res.statusCode }),
    },
    customSuccessMessage: (req, res, responseTime) =>
      `${req.method} ${req.url} ${res.statusCode} (${responseTime}ms)`,
    customErrorMessage: (req, res, err) =>
      `${req.method} ${req.url} ${res.statusCode} — ${err.message}`,

    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) return "error"
      if (res.statusCode >= 400) return "warn"
      return "info"
    },
  }),
)

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

// 3.5 Booking endpoints get a tighter budget than the 300/15min global limit.
app.use(
  "/api/v1/booking",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { data: null, message: "Too many requests, please slow down", meta: null },
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
