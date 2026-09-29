import { smtpConfig } from "./AppConfig"
import { logger } from "./logger"

const normalizedPass = smtpConfig.password.replace(/\s+/g, "")
const isGmailService = smtpConfig.service.toLowerCase() === "gmail"

export const transportConfig: Record<string, unknown> = {
  ...(isGmailService ? { service: smtpConfig.service } : {}),
  ...(!isGmailService ? { host: smtpConfig.host, port: smtpConfig.port, secure: smtpConfig.port === 465 } : {}),
  auth: {
    user: smtpConfig.user,
    pass: normalizedPass,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
}

export const fromAddress = smtpConfig.fromAddress || smtpConfig.user
export const notifyEmail = smtpConfig.adminNotifyEmail || smtpConfig.fromAddress || smtpConfig.user

export const emailProvider = smtpConfig.resendApiKey ? "resend" : "smtp"

if (!smtpConfig.resendApiKey && (!smtpConfig.user || !normalizedPass)) {
  logger.warn({ module: "smtpConfig" }, "Neither RESEND_API_KEY nor SMTP_USER/PASSWORD is set — emails will fail silently. Configure email credentials in .env / Render dashboard.")
}
if (!fromAddress && !smtpConfig.resendApiKey) {
  logger.warn({ module: "smtpConfig" }, "FROM_ADDRESS and SMTP_USER are empty — no sender address configured.")
}
if (smtpConfig.resendApiKey && !smtpConfig.resendFrom) {
  logger.warn(
    { module: "smtpConfig" },
    "RESEND_API_KEY is set but RESEND_FROM is empty — configure a verified domain sender; onboarding@resend.dev is restricted to Resend account testing.",
  )
}
if (!smtpConfig.adminNotifyEmail) {
  logger.warn(
    { module: "smtpConfig" },
    "ADMIN_NOTIFY_EMAIL is empty — booking/contact notifications will be sent to FROM_ADDRESS instead.",
  )
}
