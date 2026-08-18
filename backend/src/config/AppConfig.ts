import { config } from "dotenv"

config()

/** All process.env access lives HERE. No other file reads process.env. */

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    // Fail fast — never boot with a missing secret (no silent fallbacks).
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

const port = Number(process.env.PORT ?? 9005)

export const appConfig = {
  port,
  imagePath: process.env.IMAGE_BASE_PATH ?? `http://localhost:${port}/images/`,
  jwtSecret: required("JWT_SECRET"),
  jwtRefreshSecret: required("JWT_REFRESH_SECRET"),
  allowedOrigins: (process.env.ALLOWED_ORIGINS ?? "http://localhost:5173").split(",").map((o) => o.trim()),
}

export const mongoConfig = {
  url: required("MONGODB_URL"),
  dbName: process.env.DB_NAME || "yatriko-gears",
}

export const smtpConfig = {
  service: process.env.SMTP_SERVICE ?? "gmail",
  host: process.env.SMTP_HOST ?? "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT ?? 587),
  user: process.env.SMTP_USER ?? "",
  password: process.env.SMTP_PASSWORD ?? "",
  fromAddress: process.env.FROM_ADDRESS ?? "",
}

export const cloudinaryConfig = {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
  apiKey: process.env.CLOUDINARY_API_KEY ?? "",
  apiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
  videoFolder: "yatriko/videos",
}

export const geminiConfig = {
  apiKey: process.env.GEMINI_API_KEY ?? "",
}

export const adminSeedConfig = {
  name: process.env.ADMIN_NAME ?? "Yatriko Admin",
  email: process.env.ADMIN_EMAIL ?? "admin@yatrikogears.com",
  password: process.env.ADMIN_PASSWORD ?? "",
  phone: process.env.ADMIN_PHONE ?? "9800000000",
}
