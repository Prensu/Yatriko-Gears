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

/**
 * Google Sign-In. Only the client id is needed: the browser gets an ID token
 * from Google and we verify its signature against Google's public keys, so
 * there is no client secret to keep.
 */
export const googleConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID ?? "",
  get isConfigured() {
    return this.clientId.length > 0
  },
}

/**
 * eSewa ePay v2.
 * The defaults are eSewa's own PUBLIC sandbox credentials, published at
 * developer.esewa.com.np/pages/Test-credentials — they are not secrets, and
 * they only ever talk to the rc- (test) gateway. Production values must be
 * supplied through .env; check esewaConfig.isSandbox before going live.
 */
export const esewaConfig = {
  productCode: process.env.ESEWA_PRODUCT_CODE ?? "EPAYTEST",
  secretKey: process.env.ESEWA_SECRET_KEY ?? "8gBm/:&EnhH.1/q",
  formUrl: process.env.ESEWA_FORM_URL ?? "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
  statusUrl:
    process.env.ESEWA_STATUS_URL ?? "https://rc.esewa.com.np/api/epay/transaction/status/",
  /** Where eSewa sends the customer back to — pages on the public site. */
  siteUrl: process.env.PUBLIC_SITE_URL ?? "http://localhost:5173",
  get isSandbox() {
    return this.productCode === "EPAYTEST"
  },
}

export const adminSeedConfig = {
  name: process.env.ADMIN_NAME ?? "Yatriko Admin",
  email: process.env.ADMIN_EMAIL ?? "admin@yatrikogears.com",
  password: process.env.ADMIN_PASSWORD ?? "",
  phone: process.env.ADMIN_PHONE ?? "9800000000",
}
